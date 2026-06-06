import os

files_modified = 0

def add_bom(filepath):
    global files_modified
    try:
        with open(filepath, 'rb') as f:
            b = f.read()
            
        if not b.startswith(b'\xef\xbb\xbf'):
            with open(filepath, 'wb') as f:
                f.write(b'\xef\xbb\xbf' + b)
            files_modified += 1
            print(f"Added BOM to {filepath}")
    except Exception as e:
        print(f"Error on {filepath}: {e}")

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.css')):
            path = os.path.join(root, file)
            add_bom(path)

print(f"Total files modified: {files_modified}")
