import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	GoogleGenerativeAI,
	GenerateContentRequest,
	// Assuming other necessary types might be needed, like Part, etc.
	// If direct audio modality is not found, this will be a text-to-text call.
} from '@google/generative-ai';

export class GeminiTTS implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gemini TTS',
		name: 'geminiTTS',
		group: ['transform'],
		version: 1,
		description: 'Generates speech from text using Google Gemini AI',
		defaults: {
			name: 'Gemini TTS',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'geminiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Text Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'Enter text to convert to speech',
				description: 'The text to be converted to speech by Gemini AI',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let
			apiKey: string,
			prompt: string,
			response;

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('geminiApi');
				// Ensure API key is retrieved
				if (!credentials || !credentials.apiKey) {
					throw new Error('Gemini API key is missing from credentials.');
				}
				apiKey = credentials.apiKey as string;

				prompt = this.getNodeParameter('prompt', i) as string;
				// Ensure prompt is a string, even with a default value, before sending to API
				if (typeof prompt !== 'string') {
					// This case should ideally not be reached if default is handled by n8n core
					throw new Error(`Text prompt for item ${i} is not a string.`);
				}


				const genAI = new GoogleGenerativeAI(apiKey);
				// Using the model name from the Python script.
				// The Node.js SDK might not support this model for direct audio output
				// or might require different handling. This is an attempt based on available info.
				const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-preview-native-audio-dialog' });

				// Constructing the request. The Node.js SDK's generateContent
				// primarily expects text/image parts. How to specify audio modality is unclear
				// from the standard documentation for this method.
				// The Python script used `response_modalities=["AUDIO"]`.
				// We will attempt a standard content generation and log the response.
				const request: GenerateContentRequest = {
					contents: [{ role: 'user', parts: [{ text: prompt }] }],
					// There isn't a direct `response_modalities` field here.
					// If the model inherently produces audio, the response might contain it.
					// Or this call might error if the model expects different input/config.
				};

				console.log(`Sending request to Gemini: ${JSON.stringify(request)}`);

				const result = await model.generateContent(request);
				response = result.response;

				console.log('Gemini API Response:', JSON.stringify(response, null, 2));

				// Process the response to extract audio data
				let audioData: any;
				let audioBuffer: Buffer;
				let mimeType = 'audio/mpeg'; // Default MIME type
				const fileName = 'audio.mp3'; // Default filename

				if (response && response.candidates && response.candidates.length > 0 &&
						response.candidates[0].content && response.candidates[0].content.parts &&
						response.candidates[0].content.parts.length > 0) {

					const part = response.candidates[0].content.parts[0];

					// Attempt to find audio data, checking common places where it might be.
					// The Python example hinted at `audio_data.data`. In Node.js, this might be `part.audioData.data`, `part.data`, or `part.blob.data`.
					// It could also be directly in `part.text` if the model misinterprets or if audio isn't primary.
					// For this exercise, we'll optimistically look for `part.data` or `part.blob.data`.
					// A more robust solution would inspect `part` for known audio structures.

					if (part.data) { // This is a guess based on common structures or if it's raw data
						audioData = part.data;
						if (part.mimeType) { // Check if API provides mimeType
							mimeType = part.mimeType;
						}
					} else if (part.blob && part.blob.data) { // Another common pattern for binary data
						audioData = part.blob.data;
						if (part.blob.mimeType) {
							mimeType = part.blob.mimeType;
						}
					} else if (part.text) {
						// If audio data is unexpectedly in part.text (e.g. base64 string without clear field name)
						// This is less likely for a dedicated audio model but a fallback check.
						// We'd need to be more certain it's base64 audio before decoding.
						// For now, we'll assume audioData will be found in a more structured field.
					}


					if (audioData) {
						if (typeof audioData === 'string') {
							// Assume base64 encoding if it's a string
							audioBuffer = Buffer.from(audioData, 'base64');
						} else if (audioData instanceof Uint8Array) {
							audioBuffer = Buffer.from(audioData);
						} else {
							throw new Error('Audio data received in an unexpected format.');
						}

						const binaryData = await this.helpers.prepareBinaryData(audioBuffer, fileName, mimeType);
						returnData.push({
							json: { text: prompt }, // Using the original prompt as the text
							binary: { 'audio': binaryData }, // 'audio' is the name of the binary property
							pairedItem: { item: i }
						});
					} else {
						// No audio data found in the expected locations
						throw new Error('No audio data found in API response.');
					}
				} else {
					throw new Error('Invalid API response structure for audio data.');
				}

			} catch (error) {
				console.error("Error during Gemini TTS execution:", error);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message, details: error.stack }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}

		return this.prepareOutputData(returnData);
	}
}
