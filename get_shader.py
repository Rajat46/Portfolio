import urllib.request
import re

html = urllib.request.urlopen("https://ridgeflowshader.framer.website/").read().decode('utf-8')
js_links = set(re.findall(r'https://framerusercontent\.com/sites/[^"\'\s]+\.mjs', html))
for js in js_links:
    try:
        content = urllib.request.urlopen(js).read().decode('utf-8')
        if 'frag' in content or 'gl_FragColor' in content:
            print("Found shader in:", js)
            matches = re.findall(r'`([^`]*gl_FragColor[^`]*)`', content)
            for m in matches:
                print("SHADER:\n", m)
    except Exception as e:
        pass
