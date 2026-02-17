
import streamlit as st
import pdfplumber
import io
import pandas as pd
from docx import Document
from PIL import Image

# Configuration
st.set_page_config(page_title="SmartPDF Local", page_icon="📄", layout="centered")

# CSS for styling
st.markdown("""
    <style>
    .main { background-color: #f8fafc; }
    .stButton>button { width: 100%; border-radius: 12px; height: 3em; font-weight: bold; background-color: #4f46e5; color: white; }
    .stDownloadButton>button { width: 100%; border-radius: 12px; background-color: #059669; color: white; }
    </style>
    """, unsafe_allow_html=True)

def extract_content_locally(pdf_file, output_format):
    """Extracts text or tables using pdfplumber locally."""
    with pdfplumber.open(pdf_file) as pdf:
        if output_format == "Word":
            full_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text.append(text)
            return "\n\n".join(full_text)
        else:
            # Table extraction
            all_tables = []
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    # Filter out empty tables
                    if any(any(cell for cell in row if cell) for row in table):
                        all_tables.extend(table)
                        all_tables.append([]) # Gap between tables
            return all_tables

def create_docx(content):
    """Generates a .docx file from text content."""
    doc = Document()
    doc.add_heading('Extracted Content', 0)
    for paragraph in content.split('\n\n'):
        if paragraph.strip():
            doc.add_paragraph(paragraph)
    
    target = io.BytesIO()
    doc.save(target)
    return target.getvalue()

def create_excel(tables):
    """Generates an .xlsx file from 2D list."""
    if not tables:
        # Create empty df if no tables found
        df = pd.DataFrame([["No tables detected in PDF"]])
    else:
        df = pd.DataFrame(tables)
        
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, header=False)
    return output.getvalue()

def main():
    st.title("📄 SmartPDF Converter")
    st.subheader("Fast Local PDF to Word & Excel")
    st.info("🔒 Private: All processing happens locally on this server. No data is sent to external APIs.")
    
    uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")
    
    if uploaded_file:
        col1, col2 = st.columns(2)
        with col1:
            output_format = st.radio("Convert to:", ["Word", "Excel"])
        
        if st.button("🚀 Convert Now"):
            try:
                with st.status("Processing document locally...", expanded=True) as status:
                    st.write("Reading PDF structure...")
                    result = extract_content_locally(uploaded_file, output_format)
                    
                    st.write("Generating file...")
                    if output_format == "Word":
                        file_bytes = create_docx(result)
                        ext = "docx"
                        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    else:
                        file_bytes = create_excel(result)
                        ext = "xlsx"
                        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    
                    status.update(label="Conversion Complete!", state="complete")

                st.success(f"Successfully converted to {output_format}!")
                st.download_button(
                    label=f"⬇️ Download {output_format} File",
                    data=file_bytes,
                    file_name=f"converted_document.{ext}",
                    mime=mime
                )
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")

    st.divider()
    st.caption("Secure Local Engine. No internet connection required for processing.")

if __name__ == "__main__":
    main()
