from bs4 import BeautifulSoup

from plane.utils.s3 import S3


def parse_text_to_html(html, features="html.parser"):
    return BeautifulSoup(html, features)


def refresh_url_content(html):
    s3 = S3()
    for img_tag in html.find_all("img"):
        old_src = img_tag["src"]
        new_url = s3.refresh_url(old_src)
        img_tag["src"] = new_url

    return html
