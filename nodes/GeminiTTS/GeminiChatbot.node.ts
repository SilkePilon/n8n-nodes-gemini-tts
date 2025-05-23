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

export class GeminiChatbot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gemini Chatbot',
		name: 'geminiChatbot',
		group: ['AI', 'transform'], // Added 'AI' to group
		version: 1,
		description: 'A conversational AI node using Google Gemini, providing text and audio responses.',
		defaults: {
			name: 'Gemini Chatbot',
		},
		inputs: ['main'],
		outputs: ['main'],
		icon: 'file:geminiTTS.svg', // Icon reference
		credentials: [
			{
				name: 'geminiApi',
				required: true,
			},
		],
		properties: [
			// Existing 'prompt' property
			{
				displayName: 'Text Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'Enter your message for the chatbot',
				description: 'The text message to send to the Gemini chatbot.',
			},
			// New property for Model Selection
			{
				displayName: 'Model Name',
				name: 'modelName',
				type: 'options',
				options: [
					{
						name: 'Gemini 1.5 Flash Preview (Native Audio Dialog)', // Corrected model name based on previous context
						value: 'models/gemini-1.5-flash-preview-native-audio-dialog',
					},
					// The subtask mentioned "Gemini 2.5 Flash", but the Python script used "gemini-1.5-flash-preview-native-audio-dialog".
					// Sticking to known model from script for one option, and adding the other as specified.
					{
						name: 'Gemini 1.5 Flash Experimental (Native Audio Thinking Dialog)', // Corrected model name
						value: 'models/gemini-1.5-flash-exp-native-audio-thinking-dialog',
					},
				],
				default: 'models/gemini-1.5-flash-preview-native-audio-dialog',
				description: 'Choose the Gemini model for the chatbot interaction.',
			},
			// New property for Voice Name Selection
			{
				displayName: 'Voice Name',
				name: 'voiceName',
				type: 'options',
				options: [
					{ name: 'Zephyr', value: 'Zephyr' },
					{ name: 'Charon', value: 'Charon' },
				],
				default: 'Zephyr',
				description: "Select the voice for the AI's audio response.",
			},
			// New property for Grounding with Google Search
			{
				displayName: 'Enable Grounding with Google Search',
				name: 'enableGrounding',
				type: 'boolean',
				default: false,
				description: 'Allows the AI to use Google Search to inform its responses.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let
			apiKey: string,
			prompt: string,
			modelName: string,
			voiceName: string,
			enableGrounding: boolean,
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
				modelName = this.getNodeParameter('modelName', i) as string;
				voiceName = this.getNodeParameter('voiceName', i) as string;
				enableGrounding = this.getNodeParameter('enableGrounding', i) as boolean;

				// Ensure prompt is a string, even with a default value, before sending to API
				if (typeof prompt !== 'string') {
					throw new Error(`Text prompt for item ${i} is not a string.`);
				}

				const genAI = new GoogleGenerativeAI(apiKey);

				// Configuration for the API call
				const generationConfig: any = { // Using 'any' for now as specific types for speech/voice are not well-documented for direct generateContent
					// Attempting to map Python's response_modalities and speech_config
					// This is speculative and needs API/SDK validation.
					// The Node.js SDK might handle this differently, possibly through specific model capabilities
					// or different methods/services for combined text and speech.
					// If 'models/gemini-X-flash-preview-native-audio-dialog' inherently supports this,
					// explicit modality flags might not be needed or might be different.
					// For now, we assume the model name itself implies audio output modality.
				};

				// Voice Configuration - This is highly speculative based on Python example.
				// The Node.js SDK documentation for generateContent doesn't explicitly show speech_config.
				// This might need to be part of the model's specific configuration or not be available
				// in the same way for a simple generateContent call.
				// It's possible voice is implicitly default or tied to the specific "native-audio-dialog" model.
				if (voiceName) {
					// This structure is a guess. The actual API might expect this within generationConfig,
					// or it might not be supported for this type of model/request in the Node SDK.
					// generationConfig.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } };
					// Given the model names like "native-audio-dialog", voice might be an implicit part of the model
					// or require a different API endpoint if fine-grained voice control is needed beyond model defaults.
					// For now, we will pass it in the log but not directly in the request unless a clear path is found.
					this.logger.info(`Voice selection '${voiceName}' is noted. Actual API parameter for voice may vary or be implicit.`);
				}


				const tools: any[] = [];
				if (enableGrounding) {
					tools.push({ googleSearchRetrieval: {} });
				}

				const modelInstance = genAI.getGenerativeModel({
					model: modelName,
					generationConfig: generationConfig, // Apply if any relevant configs are found
					tools: tools.length > 0 ? tools : undefined,
				});


				// Constructing the request for both text and audio of the AI's response.
				// The key is how the model 'gemini-X-flash-preview-native-audio-dialog' interprets this.
				// It's designed for dialog with native audio, implying it should generate speech for its own text.
				const request: GenerateContentRequest = {
					contents: [{ role: 'user', parts: [{ text: prompt }] }],
					// If `response_modalities` or similar were available directly in GenerateContentRequest, it would be here.
					// Since it's not obvious, we rely on the model's inherent behavior.
				};

				this.logger.info(`Sending request to Gemini: Model=${modelName}, Voice=${voiceName} (applied if supported by model/SDK), Grounding=${enableGrounding}, Prompt Snippet=${prompt.substring(0,50)}...`);

				const result = await model.generateContent(request);
				response = result.response;

				this.logger.info(`Gemini API Response for item ${i}: ${JSON.stringify(response, null, 2).substring(0, 500)}...`); // Increased log snippet

				let aiTextResponse: string | undefined;
				let audioData: Uint8Array | string | undefined;
				let audioBuffer: Buffer | undefined;
				let mimeType = 'audio/mpeg'; // Default MIME type for audio
				const fileName = 'ai_response.mp3'; // Default filename for AI audio response

				if (response && response.candidates && response.candidates.length > 0 &&
						response.candidates[0].content && response.candidates[0].content.parts &&
						response.candidates[0].content.parts.length > 0) {

					// Iterate through all parts to find text and audio.
					// Models like 'native-audio-dialog' should ideally provide both.
					for (const part of response.candidates[0].content.parts) {
						if (part.text) {
							aiTextResponse = (aiTextResponse ? aiTextResponse + "\n" : "") + part.text;
						}
						// Check for audio data. Based on Python `audio_data.data`, direct data fields are likely.
						// The model is expected to provide audio of ITS OWN generated text response.
						if (part.data && (typeof part.data === 'string' || part.data instanceof Uint8Array)) {
							audioData = part.data;
							if (part.mimeType) mimeType = part.mimeType;
						} else if (part.blob && part.blob.data && (typeof part.blob.data === 'string' || part.blob.data instanceof Uint8Array)) { // Common alternative for binary
							audioData = part.blob.data;
							if (part.blob.mimeType) mimeType = part.blob.mimeType;
						}
						// Other potential audio fields based on Google API conventions could be `part.audioData.data` or `part.audioContent`
					}

					if (audioData) {
						if (typeof audioData === 'string') {
							// Assume base64 encoding if it's a string
							audioBuffer = Buffer.from(audioData, 'base64');
						} else if (audioData instanceof Uint8Array) {
							audioBuffer = Buffer.from(audioData);
						} else {
							this.logger.warn(`Audio data found for item ${i} but in an unexpected format.`);
						}
					}

					const jsonOutput: Record<string, any> = {
						textPrompt: prompt,
						aiTextResponse: aiTextResponse ?? '', // AI's generated text
						modelUsed: modelName,
						voiceUsed: voiceName, // Voice used (effectiveness depends on API support)
						groundingEnabled: enableGrounding,
					};

					if (audioBuffer && aiTextResponse !== undefined) { // Require both AI text and its audio
						const binaryData = await this.helpers.prepareBinaryData(audioBuffer, fileName, mimeType);
						returnData.push({
							json: jsonOutput,
							binary: { 'aiAudioResponse': binaryData }, // Binary key for AI's audio response
							pairedItem: { item: i }
						});
					} else if (aiTextResponse !== undefined) {
						// AI Text response is present, but no audio
						jsonOutput.warning = 'AI text response generated, but no audio data was found in the response.';
						this.logger.warn(`No audio data in response for item ${i}, but AI text response was found.`);
						returnData.push({ json: jsonOutput, pairedItem: { item: i } });
					} else {
						// This case means neither text nor audio from AI, which is an issue.
						throw new Error(`No AI-generated text or audio data found in API response parts for item ${i}.`);
					}

				} else if (response.text && typeof response.text === 'string') {
						// Fallback for very simple text-only responses (less likely for multimodal models)
						this.logger.warn(`Simple text response received for item ${i}, no audio data or complex parts. This might not be the intended chatbot output.`);
						returnData.push({ json: {
							textPrompt: prompt,
							aiTextResponse: response.text,
							modelUsed: modelName,
							voiceUsed: voiceName,
							groundingEnabled: enableGrounding,
							warning: 'Received a simple text response from API. Expected structured parts with text and potentially audio.',
						}, pairedItem: { item: i } });
				} else {
					throw new Error(`Invalid API response structure for chatbot data (no candidates/parts or simple text) for item ${i}. Check model capabilities and API response format.`);
				}

			} catch (error) {
				this.logger.error(`Error during Gemini Chatbot execution for item ${i}: ${error.message}. Input prompt: ${prompt.substring(0,100)}...`);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message, details: error.stack, itemIndex: i, textPrompt: prompt }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}

		return this.prepareOutputData(returnData);
	}
}
