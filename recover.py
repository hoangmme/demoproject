import json

log_file = "/Users/hoji/.gemini/antigravity/brain/ce2c9c4c-7e04-428c-906c-1718b218744f/.system_generated/logs/transcript_full.jsonl"

last_content = None
max_length = 0

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
        except Exception as e:
            pass

print(f"Found CodeContent? {last_content is not None}")
if last_content:
    print(f"Length: {len(last_content)}")
    with open('index_recovered.html', 'w') as out:
        out.write(last_content)
