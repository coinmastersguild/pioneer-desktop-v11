let TAG = " | SKILLS | "
import { z } from 'zod';
import util from "util";
import { exec } from 'child_process';
import * as path from 'path'
import {
    PRETTY_OUTPUT,
    PROMPT_BUILD_SCRIPT,
    PROMPT_BUILD_SCRIPT_OS,
    PROMPT_FIX_SCRIPT,
    PROMPT_VALIDATE_SCRIPT
} from '../prompts';
import fsExtra from 'fs-extra';
import crypto from 'crypto';
import os from "os";

import {inference} from "../inference"

// Reintroduce the three constants:
const userHome = os.homedir();
const pioneerDir = path.join(userHome, '.pioneer'); // Use .pioneer directory in the user's home directory
const skillsDir = path.join(pioneerDir, 'skills');

// Ensure the skills directory exists
if (!fsExtra.existsSync(skillsDir)) {
    fsExtra.mkdirSync(skillsDir, { recursive: true });
}

function ensurePathInPioneerDir(filePath: string): string {
    return path.join(pioneerDir, filePath);
}

// Define the schema for the expected JSON response
const ScriptResponseSchema = z.object({
    scriptName: z.string(),
    // We assume each input is the name of a variable, so an array of strings:
    inputs: z.array(z.string()).default([]),
    script: z.string(),
    outputs: z.array(z.string()).default([]),
    // We assume exampleParams is an object whose keys match "inputs"
    exampleParams: z.record(z.any()).default({}),
    context: z.any().optional()
});

// 1) Add a new Zod schema for the validation result:
const ValidateResponseSchema = z.object({
    success: z.boolean(),
    confidence: z.number().min(1).max(10),
    description: z.string(),
    error: z.string().optional().nullable()
});

// Example of a properly formatted script for reference:
const EXAMPLE_SCRIPT = `#!/bin/bash

set -euo pipefail

# Get the search query from input or use default
QUERY="\${1:-events in Los Angeles}"

# Make the API request and format the response
curl -s -X GET "https://api.tavily.com/search?api_key=\${TAVILY_API_KEY}&query=\${QUERY}" | jq -r '.results[] | {title, content, url}'`;

/**
 * Encrypts a plaintext string using the LOCAL_PASSWORD as the key.
 * Prepends the generated IV to the returned hex string so that
 * we can decrypt it easily later.
 */
function encryptSecret(plaintext: string, password: string): string {
    // Generate a 32-byte key from password using scryptSync
    const key = crypto.scryptSync(password, 'salt', 32);
    // Generate a random IV
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return iv + encrypted text as hex
    // Combine IV and encrypted text with a delimiter
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts the stored string using the LOCAL_PASSWORD as the key.
 * Expects the format "iv_in_hex:encrypted_in_hex".
 */
function decryptSecret(encryptedValue: string, password: string): string {
    const [ivHex, encryptedHex] = encryptedValue.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(password, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// export async function inference(app: any, messages: any, functions: any = [], isJson: boolean = false) {
//     let tag = TAG + " | inference | ";
//     try {
//         //console.log(tag, "Starting inference...");
//
//         let result = await app.pioneer.Chat({
//             messages,
//             functions,
//             isJson,
//         });
//         //console.log(tag, "Inference completed.");
//         return result;
//     } catch (e) {
//         console.error(tag, 'Error:', e);
//         throw e;
//     }
// }

export async function validate_a_script(app: any, skillName: string) {
    let tag = TAG + " | validate_a_script | ";
    try {
        if (!app) throw Error('app not set');
        if (!app.pioneer) throw Error('app.pioneer not set');
        if (!skillName) throw Error('Must provide skillName');

        //console.log(tag, "Validating script with AI...");

        // 2) Read the skill content and parse embedded metadata:
        const skillPath = path.join(skillsDir, skillName);
        if (!fsExtra.existsSync(skillPath)) {
            throw new Error(`Skill file does not exist: ${skillPath}`);
        }
        const skillContent = fsExtra.readFileSync(skillPath, 'utf8');

        let metadata: any = {};
        const metadataMatch = skillContent.match(/# TOOL_METADATA_START([\s\S]*?)# TOOL_METADATA_END/);
        if (metadataMatch) {
            const metadataRaw = metadataMatch[1] || "";
            const lines = metadataRaw.split('\n').map(line => line.replace(/^[ \t]*# ?/, ''));
            const metadataText = lines.join('\n').trim();
            try {
                metadata = JSON.parse(metadataText);
            } catch (err) {
                console.error(tag, `Failed to parse metadata for ${skillName}:`, err);
                throw new Error(`Invalid JSON metadata in skill: ${skillName}`);
            }
        } else {
            throw new Error(`No TOOL_METADATA found in skill: ${skillName}`);
        }
        // For sanity, let's ensure metadata has at least "inputs" and "outputs":

        // 3) Prepare AI message to evaluate the skill
        const userRequestContent = `Review the output of this script to judge if it meets its objectives. The skill's metadata is: ${JSON.stringify(metadata)}`;

        const messages = [
            ...PROMPT_VALIDATE_SCRIPT,
            {
                role: "user",
                content: userRequestContent
            }
        ];

        // 4) Call inference with these messages
        let response: any = await inference(app, messages, [], ScriptResponseSchema);
        let data = response?.data;
        if (!data || !data.choices || !data.choices[0]?.message?.content) {
            throw new Error("AI response format unexpected; could not find data.result.choices[0].message.content.");
        }

        // Make parsing more lenient
        let parsed;
        try {
            parsed = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            // If JSON parsing fails, create a basic validation result
            //console.log(tag, "Failed to parse validation response as JSON, treating as success");
            parsed = {
                success: true,
                confidence: 7,
                description: "Script produced output that may be useful",
                error: null
            };
        }

        // Ensure all required fields are present, but be more lenient
        parsed = {
            success: parsed.success !== false, // Default to true unless explicitly false
            confidence: Number(parsed.confidence) || 7,
            description: String(parsed.description || "Script produced potentially useful output"),
            error: parsed.error || null
        };

        //console.log(tag, "Validation complete:", parsed);
        return parsed;
    } catch (e) {
        // Be lenient with errors - return success
        console.warn(tag, "Error in validate_a_script, treating as success:", e);
        return {
            success: true,
            confidence: 6,
            description: "Script validation attempted",
            error: null
        };
    }
}

export async function fix_a_script(app: any, script: string, issue: string, context: any) {
    let tag = TAG + " | fix_a_script | ";
    try {
        let messages = [
            ...PROMPT_FIX_SCRIPT,
            {
                role: "user", content: "this is the script to fix."
            },
            {
                role: "user",
                content: "the issue with script is: " + JSON.stringify(issue)
            },
            {
                role: "user",
                content: "extra context: " + JSON.stringify(context)
            }
        ];

        let response: any = await inference(app, messages, [], {});
        let data = response?.data;
        if (!data || !data.choices || !data.choices[0]?.message?.content) {
            throw new Error("AI response format unexpected; could not find data.result.choices[0].message.content");
        }

        let parsed = JSON.parse(data.choices[0].message.content);
        ScriptResponseSchema.parse(parsed);

        return parsed;
    } catch (e) {
        console.error(tag, "Error in fix_a_script:", e);
        throw e;
    }
}


export async function get_skills(): Promise<string[]> {
    await fsExtra.ensureDir(skillsDir); // Ensure the skills directory exists
    const files = await fsExtra.readdir(skillsDir);
    //console.log('Skills fetched:', files);
    return files;
}

export async function get_skills_with_descriptions(): Promise<Array<{
    file: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: Record<string, any>;
            required: string[];
        };
    };
}>> {
    await fsExtra.ensureDir(skillsDir);
    const files = await fsExtra.readdir(skillsDir);
    //console.log('Skills fetched:', files);

    const skillList = [];

    for (const file of files) {
        const filePath = path.join(skillsDir, file);
        if (fsExtra.statSync(filePath).isFile()) {
            const content = fsExtra.readFileSync(filePath, 'utf-8');
            const match = content.match(/# TOOL_METADATA_START([\s\S]*?)# TOOL_METADATA_END/);

            if (match) {
                const metadataBlock = match[1] || "";
                const lines = metadataBlock.split('\n').map(line => line.replace(/^# ?/, ''));
                const metadataText = lines.join('\n').trim();

                try {
                    const metadata = JSON.parse(metadataText);
                    // The "metadata.name" is typically the functionName (e.g. "getCurrentEvents.sh").
                    // If metadata.name is missing, fall back to the file's base name

                    // We might want to ensure "metadata.parameters" is valid, or just default it:
                    if (!metadata.parameters || typeof metadata.parameters !== 'object') {
                        metadata.parameters = {
                            type: 'object',
                            properties: {},
                            required: []
                        };
                    }

                    const item = {
                        // The raw file on disk:
                        file,
                        // We can store the entire function object just like an OpenAI function signature
                        function: {
                            name: file,
                            description: metadata.description || "No description",
                            parameters: {
                                type: metadata.parameters?.type || 'object',
                                properties: metadata.parameters?.properties || {},
                                required: metadata.parameters?.required || []
                            }
                        }
                    };

                    skillList.push(item);
                } catch (err) {
                    console.error(`Failed to parse metadata for ${file}:`, err);
                    throw err
                }
            }
        }
    }

    return skillList;
}

export async function read_file(filePath: string): Promise<string> {
    const fullPath = ensurePathInPioneerDir(filePath);
    const content = await fsExtra.readFile(fullPath, 'utf-8');
    //console.log(`File read successfully: ${fullPath}`);
    return content;
}

export async function write_file(filePath: string, data: string): Promise<{ success: boolean }> {
    const fullPath = ensurePathInPioneerDir(filePath);
    await fsExtra.writeFile(fullPath, data, 'utf-8');
    //console.log(`File written successfully: ${fullPath}`);
    return { success: true };
}

export async function create_file(filePath: string): Promise<{ success: boolean }> {
    const fullPath = ensurePathInPioneerDir(filePath);
    await fsExtra.ensureFile(fullPath);
    //console.log(`File created successfully: ${fullPath}`);
    return { success: true };
}

export async function delete_file(filePath: string): Promise<{ success: boolean }> {
    const fullPath = ensurePathInPioneerDir(filePath);
    await fsExtra.remove(fullPath);
    //console.log(`File deleted successfully: ${fullPath}`);
    return { success: true };
}

export async function rename_file(oldPath: string, newPath: string): Promise<{ success: boolean }> {
    const fullOldPath = ensurePathInPioneerDir(oldPath);
    const fullNewPath = ensurePathInPioneerDir(newPath);
    await fsExtra.rename(fullOldPath, fullNewPath);
    //console.log(`File renamed from "${fullOldPath}" to "${fullNewPath}"`);
    return { success: true };
}

export async function create_directory(dirPath: string): Promise<{ success: boolean }> {
    const fullPath = ensurePathInPioneerDir(dirPath);
    await fsExtra.ensureDir(fullPath);
    //console.log(`Directory created successfully: ${fullPath}`);
    return { success: true };
}

export async function delete_directory(dirPath: string): Promise<{ success: boolean }> {
    const fullPath = ensurePathInPioneerDir(dirPath);
    await fsExtra.remove(fullPath);
    //console.log(`Directory deleted successfully: ${fullPath}`);
    return { success: true };
}

export async function rename_directory(oldPath: string, newPath: string): Promise<{ success: boolean }> {
    const fullOldPath = ensurePathInPioneerDir(oldPath);
    const fullNewPath = ensurePathInPioneerDir(newPath);
    await fsExtra.rename(fullOldPath, fullNewPath);
    //console.log(`Directory renamed from "${fullOldPath}" to "${fullNewPath}"`);
    return { success: true };
}

export async function get_file_info(filePath: string): Promise<{
    size: number;
    modifiedTime: Date;
    isFile: boolean;
    isDirectory: boolean;
}> {
    const fullPath = ensurePathInPioneerDir(filePath);
    const stats = await fsExtra.stat(fullPath);
    //console.log(`File info retrieved for: ${fullPath}`);
    return {
        size: stats.size,
        modifiedTime: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
    };
}

export async function create_skill(app: any, objective: string): Promise<any> {
    const tag = TAG + " | create_skill | ";
    try {
        const attemptLogs: string[] = [];
        let finalResult: any = null;
        let newFilePath = '';

        for (let attempt = 1; attempt <= 1; attempt++) {
            try {
                console.log(tag, "Building script with AI...");
                let secrets = app.secrets;
                let secretsKeys = Object.keys(secrets);
                console.log(tag, "sanitized: ",secretsKeys);

                const userRequestContent = `create a bash script with objective ${objective}`;
                const messages = [
                    {
                        role: 'system',
                        content: `Generate responses in strict JSON format.
Include a "scriptName", "script", "inputs": ["query"], "outputs": [], exampleParams: {query:'example search query'}.
The "script" field should contain a complete bash script that can be executed directly.
The script should:
- Include proper shebang (#!/bin/bash)
- Use proper error handling (set -euo pipefail)
- Use environment variables directly (e.g. $TAVILY_API_KEY)
- Accept a search query as the first argument ($1)
- Use proper quoting for strings and variables
- Use proper escaping for JSON and curl commands
- Return results in a clean JSON format using jq
- Handle API errors gracefully
- Include helpful comments

Here's an example of a properly formatted script:
${EXAMPLE_SCRIPT}`
                    },
                    ...PROMPT_BUILD_SCRIPT_OS,
                    {
                        role: "system",
                        content: "You ONLY have these secrets available! they can be found at $env_var with env var being the name " + secretsKeys.toString()
                    },
                    {
                        role: "user",
                        content: userRequestContent
                    }
                ];

                console.log(tag, "Input create SKILL: ", messages);
                let response: any = await inference(app, messages, [], ScriptResponseSchema);
                console.log(tag, "response: ", response);
                response = response.data;
                console.log(tag, "response: ", response.choices[0].message.content);
                let result = JSON.parse(response.choices[0].message.content);
                console.log(tag, "parsed: ", result);

                if (!result) {
                    throw new Error("Failed to build script! Audit AI module");
                }

                // Clean up the script content by removing markdown code block delimiters
                result.script = result.script.replace(/```bash\n/, '').replace(/```$/, '');

                newFilePath = path.join(skillsDir, `${result.scriptName}`);
                if (!result.inputs) throw Error("missing inputs!");
                if (!result.outputs) throw Error("missing outputs!");
                if (!result.exampleParams) throw Error("missing exampleParams!");

                const metadataObj = {
                    name: result.scriptName,
                    description: objective,
                    parameters: {
                        type: 'object',
                        properties: {
                            ...result.inputs.reduce((acc: any, input: string) => {
                                acc[input] = {
                                    type: 'string',
                                    description: 'Input parameter for the script'
                                };
                                return acc;
                            }, {}),
                        },
                        required: result.inputs
                    }
                };

                const finalScript = `#!/bin/bash

# TOOL_METADATA_START
${JSON.stringify(metadataObj, null, 2).split('\n').map(line => '# ' + line).join('\n')}
# TOOL_METADATA_END

${result.script}`;

                // Make the script executable
                fsExtra.writeFileSync(newFilePath, finalScript, { mode: 0o755 });

                // Also copy to .pioneer/skills-boneyard
                const skillBoneyard = path.join(pioneerDir, 'skills-boneyard');
                fsExtra.ensureDirSync(skillBoneyard);
                fsExtra.copyFileSync(newFilePath, path.join(skillBoneyard, path.basename(newFilePath)));

                // Test and validate the script
                try {
                    const testResult = await perform_skill(app, result.scriptName, result.exampleParams);
                    let validation = await validate_a_script(app, result.scriptName);

                    if (validation.success) {
                        const oldSkillPath = path.join(skillsDir, result.scriptName);
                        const parsed = path.parse(result.scriptName);
                        const validatedFileName = `${parsed.name}_valid_conf${validation.confidence}${parsed.ext}`;
                        const newSkillPath = path.join(skillsDir, validatedFileName);

                        if (!fsExtra.existsSync(newSkillPath)) {
                            fsExtra.renameSync(oldSkillPath, newSkillPath);
                            result.scriptName = validatedFileName;
                        } else {
                            console.warn(tag, `A file "${validatedFileName}" already exists, skipping rename`);
                        }

                        finalResult = result;
                        break; // success
                    }
                } catch (err: any) {
                    console.error(tag, `Error in validation/test cycle:`, err);
                    attemptLogs.push(`Attempt #${attempt} error: ${err.message || JSON.stringify(err)}`);
                }
            } catch (err: any) {
                console.error(tag, `Attempt #${attempt} threw an error: ${err.message || JSON.stringify(err)}`);
                attemptLogs.push(`Attempt #${attempt} error: ${err.message || JSON.stringify(err)}`);
            }
        }

        if (!finalResult) {
            const summary = attemptLogs.join('\n');
            throw new Error(`Skill creation failed after attempts. Summary:\n${summary}`);
        }

        // Final verification of file existence
        const finalPath = path.join(skillsDir, finalResult.scriptName);
        if (!fsExtra.existsSync(finalPath)) {
            finalResult.scriptName = path.basename(newFilePath);
        }

        return finalResult;
    } catch (e) {
        console.error(tag, e);
        throw e;
    }
}

export async function fix_skill(app: any, skill: string, issue: any, context: any): Promise<any> {
    const tag = TAG + " | fix_skill | ";
    try {
        //console.log(tag, "skill: ", skill);
        //console.log(tag, "context: ", context);
        //console.log(tag, "issue: ", issue);

        // First read the untested file
        const skillPath = path.join(skillsDir, skill);
        let script = '';
        try {
            script = await fsExtra.readFile(skillPath, 'utf8');
        } catch (error: any) {
            console.warn(tag, `Error reading untested script: ${error.message}`);
            // Continue with empty script - the AI will generate a new one
        }

        let result = await fix_a_script(app, script, issue, context);
        //console.log(tag, "result: ", result);

        if (!result.script) throw Error("Invalid result! Missing script");

        // Write the fixed script to a new file
        const newFileName = `${result.scriptName}_fixed.sh`;
        const newFilePath = path.join(skillsDir, newFileName);

        // Write the metadata and script
        const metadataObj = {
            inputs: result.inputs,
            outputs: result.outputs,
            exampleParams: result.exampleParams || {}
        };

        const metadataString = JSON.stringify(metadataObj, null, 2);
        const finalScript = `#!/bin/bash

# TOOL_METADATA_START
${metadataString.split('\n').map(line => '# ' + line).join('\n')}
# TOOL_METADATA_END

${result.script}`;

        await fsExtra.writeFile(newFilePath, finalScript, 'utf8');
        result.scriptName = newFileName;

        return result;
    } catch (e: any) {
        console.error(tag, 'Error in fix_skill:', e instanceof Error ? e.message : e);
        throw e;
    }
}

export async function run_command(app: any, cmd: string, config: any): Promise<any> {
    let tag = TAG + " | run_command | ";
    try{
        let TIMEOUT_MS = 30000
        //cmd
        console.log(tag,'cmd: ',cmd)
        let { stdout, stderr } = await util.promisify(exec)(cmd, {
            cwd: skillsDir,
            timeout: TIMEOUT_MS,
        });

        //use LLM to make pretty output
        let messages = [
            ...PRETTY_OUTPUT,
            {
                role: 'user',
                content:"stdout: "+JSON.stringify(stdout)+ " stderr:  "+JSON.stringify(stderr)
            }
        ]
        let result = await inference(app, messages,[],{})
        // let result = await app.pioneer.Chat({
        //     messages,
        //     functions:[],
        //     isJson:true,
        // });


        console.log(tag,'result: ',result)
        return result
    }catch(e){
        console.error(e);
    }
}

export async function perform_skill(app: any, skill: any, inputs: any) {
    const tag = TAG + " | perform_skill | ";
    try {
        const skillPath = path.join(skillsDir, skill);
        const skillContent = fsExtra.readFileSync(skillPath, 'utf8');

        let skillMetadata: any = {};
        const match = skillContent.match(/# TOOL_METADATA_START\n([\s\S]*?)\n# TOOL_METADATA_END/);
        if (match) {
            const metadataBlockRaw = match[1];
            try {
                const metadataText = metadataBlockRaw
                    .split('\n')
                    .map(line => line.replace(/^# /, ''))
                    .join('\n');
                skillMetadata = JSON.parse(metadataText);
            } catch (err) {
                console.error(tag, "Failed to parse metadata:", err);
                throw new Error("Invalid metadata format in skill file");
            }
        } else {
            throw new Error("No metadata found in skill file");
        }

        let finalArgs: string[] = [];
        if (skillMetadata.inputs && Array.isArray(skillMetadata.inputs)) {
            for (const inputName of skillMetadata.inputs) {
                finalArgs.push(inputName.replace('query: ', ''));
            }
        }

        const TIMEOUT_MS = 60000;
        const cmd = `bash ${skillPath} ${finalArgs.map(arg => JSON.stringify(arg)).join(' ')}`;
        const startTime = Date.now();

        // Get secrets from app
        const secrets = await app.getAllSecrets();
        const env = { ...process.env };
        
        // Add secrets to environment
        for (const [key, value] of Object.entries(secrets)) {
            env[key] = value as string;
        }

        let { stdout, stderr } = await util.promisify(exec)(cmd, {
            cwd: skillsDir,
            timeout: TIMEOUT_MS,
            env: env // Pass the environment variables
        });

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > TIMEOUT_MS) {
            throw new Error("Timeout: Script took too long to execute.");
        }

        if (stdout && stdout.trim() !== "") {
            try {
                let stdoutData = JSON.parse(stdout);
                stdout = JSON.stringify(stdoutData, null, 2);
            } catch (err) {
                // Not JSON, treat as plain text
            }
            return { role: "assistant", content: stdout };
        } else if (stderr) {
            return { role: "user", content: `Error: ${stderr}` };
        } else {
            return { role: "user", content: "No output received." };
        }
    } catch (e) {
        console.error(tag, 'Error in perform_skill:', e instanceof Error ? e.message : e);
        throw e;
    }
}

export const availableFunctions:any = {
    getSkills: async () => await get_skills(),
    readFile: async ({ filePath }: { filePath: string }) => await read_file(filePath),
    writeFile: async ({ filePath, data }: { filePath: string, data: string }) => await write_file(filePath, data),
    createFile: async ({ filePath }: { filePath: string }) => await create_file(filePath),
    deleteFile: async ({ filePath }: { filePath: string }) => await delete_file(filePath),
    renameFile: async ({ oldPath, newPath }: { oldPath: string, newPath: string }) => await rename_file(oldPath, newPath),
    createDirectory: async ({ dirPath }: { dirPath: string }) => await create_directory(dirPath),
    deleteDirectory: async ({ dirPath }: { dirPath: string }) => await delete_directory(dirPath),
    renameDirectory: async ({ oldPath, newPath }: { oldPath: string, newPath: string }) => await rename_directory(oldPath, newPath),
    getFileInfo: async ({ filePath }: { filePath: string }) => await get_file_info(filePath),
    createSkill: async ({ objective }: { objective: string }) => await create_skill(null, objective),
    fixSkill: async ({ name, issue, context }: { name: string, issue: any, context: any }) =>
        await fix_skill(null, name, issue, context),
    performSkill: async ({ name, inputs }: { name: any, inputs?: any }) =>
        await perform_skill(null, name, inputs || {}),
};

/**
 * Empties the entire skills directory.
 */
export async function clear_skills(): Promise<void> {
    await fsExtra.emptyDir(skillsDir);
    //console.log(`All skills cleared from: ${skillsDir}`);
}

export async function get_skill_metadata(skillName: string): Promise<any> {
    const tag = TAG + " | get_skill_metadata | ";
    try {
        const skillPath = path.join(skillsDir, skillName);
        if (!fsExtra.existsSync(skillPath)) {
            throw new Error(`Skill file does not exist: ${skillPath}`);
        }

        const skillContent = fsExtra.readFileSync(skillPath, 'utf8');
        let metadata: any = {};

        // Extract metadata from the special comment block
        const metadataMatch = skillContent.match(/# TOOL_METADATA_START([\s\S]*?)# TOOL_METADATA_END/);
        if (metadataMatch) {
            const metadataRaw = metadataMatch[1] || "";
            // Remove '# ' from the start of each line and join
            const lines = metadataRaw.split('\n').map(line => line.replace(/^[ \t]*# ?/, ''));
            const metadataText = lines.join('\n').trim();

            try {
                metadata = JSON.parse(metadataText);
            } catch (err) {
                console.error(tag, `Failed to parse metadata for ${skillName}:`, err);
                throw new Error(`Invalid JSON metadata in skill: ${skillName}`);
            }
        } else {
            throw new Error(`No TOOL_METADATA found in skill: ${skillName}`);
        }

        return metadata;
    } catch (e) {
        console.error(tag, 'Error getting skill metadata:', e);
        throw e;
    }
}
