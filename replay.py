import json
import re
import os
import subprocess

log_file = "/Users/hoji/.gemini/antigravity/brain/ce2c9c4c-7e04-428c-906c-1718b218744f/.system_generated/logs/transcript_full.jsonl"

content = ""
start = False

with open(log_file, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    # 1. Catch the last full write
                    if tc.get('name') == 'write_to_file' and 'index.html' in tc.get('args', {}).get('TargetFile', ''):
                        if tc.get('args', {}).get('CodeContent'):
                            content = tc['args']['CodeContent']
                            start = True
                            
                    # 2. Catch replace_file_content
                    elif tc.get('name') == 'replace_file_content' and start:
                        args = tc.get('args', {})
                        if 'index.html' in args.get('TargetFile', ''):
                            target = args.get('TargetContent', '')
                            replacement = args.get('ReplacementContent', '')
                            if target in content:
                                content = content.replace(target, replacement)
                                
                    # 3. Catch multi_replace_file_content
                    elif tc.get('name') == 'multi_replace_file_content' and start:
                        args = tc.get('args', {})
                        if 'index.html' in args.get('TargetFile', ''):
                            chunks = args.get('ReplacementChunks', [])
                            for chunk in chunks:
                                target = chunk.get('TargetContent', '')
                                replacement = chunk.get('ReplacementContent', '')
                                if target in content:
                                    content = content.replace(target, replacement)

            # 4. Catch run_command (node scripts/...)
            if start and data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc.get('name') == 'run_command':
                        cmd = tc.get('args', {}).get('CommandLine', '')
                        if cmd.startswith('node scripts/') and 'index.html' in open(cmd.split(' ')[1]).read():
                            script_path = cmd.split(' ')[1]
                            
                            # STOP BEFORE DISASTROUS SCRIPT
                            if 'fix_create_user_btn.js' in script_path or 'fix_savedata.js' in script_path:
                                continue

                            with open('index_temp.html', 'w') as temp:
                                temp.write(content)
                            script_content = open(script_path).read()
                            with open(script_path, 'w') as sc:
                                sc.write(script_content.replace("'index.html'", "'index_temp.html'"))
                            subprocess.run(['node', script_path], check=False)
                            content = open('index_temp.html').read()
                            with open(script_path, 'w') as sc:
                                sc.write(script_content)
        except Exception as e:
            pass

print(f"Final length: {len(content)}")
with open('index.html', 'w') as out:
    out.write(content)
