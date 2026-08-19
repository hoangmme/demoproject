import json

log_file = "/Users/hoji/.gemini/antigravity/brain/ce2c9c4c-7e04-428c-906c-1718b218744f/.system_generated/logs/transcript_full.jsonl"

last_content = None
last_step = 0

with open(log_file, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc.get('name') in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                        args = tc.get('args', {})
                        target = args.get('TargetFile', '')
                        if 'index.html' in target:
                            if 'CodeContent' in args:
                                last_content = args['CodeContent']
                                last_step = data.get('step_index')
        except Exception as e:
            pass

print(f"Last write_to_file index.html at step: {last_step}")
