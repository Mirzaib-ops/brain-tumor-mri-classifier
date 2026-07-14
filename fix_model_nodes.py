import json

path = 'c:/Users/Mir Zaib/Desktop/brain tumar/tfjs_model/model.json'
with open(path, 'r') as f:
    data = json.load(f)

def extract_keras_2_node(args, kwargs):
    # args is a list, usually one tensor
    keras_2_nodes = []
    for arg in args:
        if isinstance(arg, dict) and arg.get('class_name') == '__keras_tensor__':
            history = arg.get('config', {}).get('keras_history', [])
            if history:
                # [name, node_index, tensor_index, kwargs]
                keras_2_nodes.append([history[0], history[1], history[2], kwargs or {}])
    return keras_2_nodes

def fix_inbound_nodes(layer):
    if 'inbound_nodes' in layer and isinstance(layer['inbound_nodes'], list):
        new_inbound_nodes = []
        for node in layer['inbound_nodes']:
            if isinstance(node, dict) and 'args' in node:
                keras_2_nodes = extract_keras_2_node(node['args'], node.get('kwargs', {}))
                if keras_2_nodes:
                    new_inbound_nodes.append(keras_2_nodes)
            elif isinstance(node, list):
                new_inbound_nodes.append(node) # Already Keras 2 format
        layer['inbound_nodes'] = new_inbound_nodes
        
    if 'config' in layer and 'layers' in layer['config']:
        for sub_layer in layer['config']['layers']:
            fix_inbound_nodes(sub_layer)

layers = data['modelTopology']['model_config']['config']['layers']
for layer in layers:
    fix_inbound_nodes(layer)

with open(path, 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print("Done fixing inbound_nodes in model.json")
