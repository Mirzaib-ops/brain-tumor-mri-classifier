import json

path = 'c:/Users/Mir Zaib/Desktop/brain tumar/tfjs_model/model.json'
with open(path, 'r') as f:
    data = json.load(f)

def fix_dtype(obj):
    if isinstance(obj, dict):
        if 'dtype' in obj and isinstance(obj['dtype'], dict) and obj['dtype'].get('class_name') == 'DTypePolicy':
            obj['dtype'] = obj['dtype']['config']['name']
            print("Fixed dtype policy")
        for k, v in obj.items():
            fix_dtype(v)
    elif isinstance(obj, list):
        for item in obj:
            fix_dtype(item)

fix_dtype(data['modelTopology'])

with open(path, 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print("Done fixing dtype in model.json")
