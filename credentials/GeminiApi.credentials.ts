import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class GeminiApi implements ICredentialType {
	name = 'geminiApi';
	displayName = 'Gemini API';
	documentationUrl = 'https://makersuite.google.com/app/apikey';
	properties = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
	];
}
