import streamlit as st
import streamlit.components.v1 as components
import os

st.set_page_config(
    page_title="Seed Companion App | Prototype",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom styling to hide Streamlit header/footer and expand the canvas
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding-top: 0rem;
        padding-bottom: 0rem;
        padding-left: 0rem;
        padding-right: 0rem;
    }
    iframe {
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }
    </style>
""", unsafe_allow_html=True)

def load_standalone_html():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read core files
    with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
    with open(os.path.join(base_dir, "style.css"), "r", encoding="utf-8") as f:
        css = f.read()
    with open(os.path.join(base_dir, "app.js"), "r", encoding="utf-8") as f:
        js = f.read()

    # Inline CSS (Replace external stylesheet reference)
    css_link = '<link rel="stylesheet" href="style.css">'
    inline_css = f"<style>\n{css}\n</style>"
    html = html.replace(css_link, inline_css)

    # Inline JS (Replace external script source link)
    js_tag = '<script src="app.js"></script>'
    inline_js = f"<script>\n{js}\n</script>"
    html = html.replace(js_tag, inline_js)

    return html

try:
    html_content = load_standalone_html()
    
    # Serve in Streamlit
    components.html(html_content, height=950, scrolling=True)
    
except Exception as e:
    st.error(f"Error compiling prototype files: {e}")
    st.info("Make sure index.html, style.css, and app.js are in the same directory as this script.")
