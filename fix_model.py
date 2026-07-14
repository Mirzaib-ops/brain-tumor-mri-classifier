import json

path = 'c:/Users/Mir Zaib/Desktop/brain tumar/tfjs_model/model.json'
with open(path, 'r') as f:
    data = json.load(f)

# Find InputLayer and fix batch_shape
layers = data['modelTopology']['model_config']['config']['layers']

# For sequential models, layers is a list. For functional models, layers is also a list
def fix_layer(layer):
    if layer['class_name'] == 'InputLayer':
        if 'batch_shape' in layer['config']:
            layer['config']['batch_input_shape'] = layer['config']['batch_shape']
            print("Fixed InputLayer batch_shape")
    
    # If the layer contains nested models (like Functional layers), we need to recurse
    if 'config' in layer and 'layers' in layer['config']:
        for sub_layer in layer['config']['layers']:
            fix_layer(sub_layer)

for layer in layers:
    fix_layer(layer)

with open(path, 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print("Done fixing model.json")
