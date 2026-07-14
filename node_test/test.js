const tf = require('@tensorflow/tfjs-node');
async function test() {
  try {
    const model = await tf.loadLayersModel('file://../tfjs_model/model.json');
    console.log('Model loaded successfully!');
  } catch(e) {
    console.error('Error loading model:', e.message);
  }
}
test();
