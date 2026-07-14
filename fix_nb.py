import json
with open("03_Brain_Tumor_Detection.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

for cell in nb.get("cells", []):
    if cell["cell_type"] == "code":
        source = cell["source"]
        if any("EXPORT_DIR = '/content/tfjs_model'" in line for line in source):
            new_source = []
            for line in source:
                if "EXPORT_DIR = '/content/tfjs_model'" in line:
                    new_source.append("EXPORT_DIR = './tfjs_model'\n")
                elif "shutil.make_archive" in line:
                    continue
                elif "from google.colab import files" in line:
                    continue
                elif "files.download" in line:
                    continue
                elif "Downloaded tfjs_model.zip" in line:
                    new_source.append("print('\\n? Model saved directly to ./tfjs_model/ folder - ready for frontend!')\n")
                elif "Zip it up and download" in line:
                    continue
                else:
                    new_source.append(line)
            cell["source"] = new_source

with open("03_Brain_Tumor_Detection.ipynb", "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

