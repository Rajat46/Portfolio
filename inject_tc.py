import sys

def inject():
    with open('index.html', 'r') as f:
        html = f.read()
    
    with open('tc.html', 'r') as f:
        tc = f.read()

    target = '<footer class="mondragon-footer" id="footer">'
    if target in html:
        # replace the target with tc + target
        new_html = html.replace(target, tc + "\n" + target)
        with open('index.html', 'w') as f:
            f.write(new_html)
        print("Successfully injected Team Culture section.")
    else:
        print("Could not find the footer tag.")

if __name__ == '__main__':
    inject()
