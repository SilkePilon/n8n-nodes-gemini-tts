![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-starter

This repo contains example nodes to help you get started building your own custom integrations for [n8n](https://n8n.io). It includes the node linter and other dependencies.

To make your custom node available to the community, you must create it as an npm package, and [submit it to the npm registry](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry).

## Prerequisites

You need the following installed on your development machine:

* [git](https://git-scm.com/downloads)
* Node.js and pnpm. Minimum version Node 20. You can find instructions on how to install both using nvm (Node Version Manager) for Linux, Mac, and WSL [here](https://github.com/nvm-sh/nvm). For Windows users, refer to Microsoft's guide to [Install NodeJS on Windows](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).
* Install n8n with:
  ```
  npm install n8n -g
  ```
* Recommended: follow n8n's guide to [set up your development environment](https://docs.n8n.io/integrations/creating-nodes/build/node-development-environment/).

## Using this starter

These are the basic steps for working with the starter. For detailed guidance on creating and publishing nodes, refer to the [documentation](https://docs.n8n.io/integrations/creating-nodes/).

1. [Generate a new repository](https://github.com/n8n-io/n8n-nodes-starter/generate) from this template repository.
2. Clone your new repo:
   ```
   git clone https://github.com/<your organization>/<your-repo-name>.git
   ```
3. Run `npm i` to install dependencies.
4. Open the project in your editor.
5. Browse the examples in `/nodes` and `/credentials`. Modify the examples, or replace them with your own nodes.
6. Update the `package.json` to match your details.
7. Run `npm lint` to check for errors or `npm lintfix` to automatically fix errors when possible.
8. Test your node locally. Refer to [Run your node locally](https://docs.n8n.io/integrations/creating-nodes/test/run-node-locally/) for guidance.
9. Replace this README with documentation for your node. Use the [README_TEMPLATE](README_TEMPLATE.md) to get started.
10. Update the LICENSE file to use your details.
11. [Publish](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) your package to npm.

## More information

Refer to our [documentation on creating nodes](https://docs.n8n.io/integrations/creating-nodes/) for detailed information on building your own nodes.

## Available Nodes

### Gemini TTS

**Description:**
The Gemini TTS node generates speech from text using Google's Gemini AI. It takes a text prompt as input and outputs an audio file along with the original text.

**Credentials:**
This node uses "Gemini API" credentials. You need to configure a new credential named `geminiApi` with your Google Gemini API Key.
1. Go to Credentials > New in n8n.
2. Search for "Gemini API" (or the display name you've set, e.g., "Gemini API Key").
3. Enter your API Key in the 'API Key' field.
4. Save the credential.

**Input Properties:**
*   **Text Prompt (prompt):** The text string you want to convert into speech.

**Output:**
The node outputs:
*   **JSON Data:** Contains the original input text under the `text` field (e.g., `{"text": "Hello world"}`).
*   **Binary Data:** An audio file (typically MP3) containing the generated speech, accessible under the `audio` property.

**Example Usage:**
1. Add a "Manual" or "Webhook" node to start your workflow and provide an initial text input if needed.
2. Add the "Gemini TTS" node.
3. In the Gemini TTS node's properties panel:
    * Select your configured "Gemini API" credential.
    * For the "Text Prompt" field, you can enter static text (e.g., "Hello, this is a test.") or use an expression to get text from a previous node (e.g., `{{ $json.inputText }}`).
4. Connect a node that can handle audio files, like "Write Binary File" to save the audio, or another node that can process/send audio.
5. Execute the workflow. The Gemini TTS node will output an item with the original text in its JSON part and the audio in its binary part.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
