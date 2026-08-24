from PIL import Image, ImageDraw, ImageFont
import os

# Create a high-resolution white background image (800 x 1000)
img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
draw = ImageDraw.Draw(img)

# Try loading standard font or fallback to default
try:
    title_font = ImageFont.truetype("arial.ttf", 28)
    heading_font = ImageFont.truetype("arial.ttf", 20)
    body_font = ImageFont.truetype("arial.ttf", 16)
    bold_font = ImageFont.truetype("arialbd.ttf", 18)
except Exception:
    title_font = ImageFont.load_default()
    heading_font = ImageFont.load_default()
    body_font = ImageFont.load_default()
    bold_font = ImageFont.load_default()

# Header / Title
draw.text((60, 50), "GLOBAL CLOUD SERVICES INC.", fill=(30, 41, 59), font=title_font)
draw.text((60, 90), "Cloud Services Monthly Invoice", fill=(71, 85, 105), font=heading_font)

draw.line([(60, 130), (740, 130)], fill=(203, 213, 225), width=2)

# Invoice Info
draw.text((60, 150), "Invoice Number: INV-9842", fill=(15, 23, 42), font=bold_font)
draw.text((60, 180), "Invoice Date: August 15, 2026", fill=(15, 23, 42), font=body_font)
draw.text((60, 210), "Customer: DocuMind Corporation", fill=(15, 23, 42), font=body_font)
draw.text((60, 240), "Payment Terms: Net 30 Days", fill=(15, 23, 42), font=body_font)

draw.line([(60, 280), (740, 280)], fill=(203, 213, 225), width=2)

# Table Header
draw.text((60, 300), "Description", fill=(15, 23, 42), font=bold_font)
draw.text((420, 300), "Qty", fill=(15, 23, 42), font=bold_font)
draw.text((530, 300), "Rate", fill=(15, 23, 42), font=bold_font)
draw.text((650, 300), "Amount", fill=(15, 23, 42), font=bold_font)

draw.line([(60, 330), (740, 330)], fill=(148, 163, 184), width=1)

# Item 1
draw.text((60, 350), "Compute Node Cluster", fill=(30, 41, 59), font=body_font)
draw.text((420, 350), "4", fill=(30, 41, 59), font=body_font)
draw.text((530, 350), "$450.00", fill=(30, 41, 59), font=body_font)
draw.text((650, 350), "$1,800.00", fill=(30, 41, 59), font=body_font)

# Item 2
draw.text((60, 390), "Managed AI API Gateway", fill=(30, 41, 59), font=body_font)
draw.text((420, 390), "1", fill=(30, 41, 59), font=body_font)
draw.text((530, 390), "$650.00", fill=(30, 41, 59), font=body_font)
draw.text((650, 390), "$650.00", fill=(30, 41, 59), font=body_font)

# Item 3
draw.text((60, 430), "CDN Data Transfer", fill=(30, 41, 59), font=body_font)
draw.text((420, 430), "2 TB", fill=(30, 41, 59), font=body_font)
draw.text((530, 430), "$120.00", fill=(30, 41, 59), font=body_font)
draw.text((650, 430), "$240.00", fill=(30, 41, 59), font=body_font)

draw.line([(60, 470), (740, 470)], fill=(203, 213, 225), width=2)

# Totals
draw.text((500, 500), "Subtotal:", fill=(71, 85, 105), font=body_font)
draw.text((650, 500), "$2,690.00", fill=(15, 23, 42), font=bold_font)

draw.text((500, 530), "Sales Tax (8%):", fill=(71, 85, 105), font=body_font)
draw.text((650, 530), "$215.20", fill=(15, 23, 42), font=body_font)

draw.line([(500, 560), (740, 560)], fill=(148, 163, 184), width=1)

draw.text((500, 580), "Total:", fill=(15, 23, 42), font=bold_font)
draw.text((650, 580), "$2,905.20", fill=(15, 23, 42), font=bold_font)

# Save to sample-data and client/public
os.makedirs("sample-data", exist_ok=True)
os.makedirs("client/public", exist_ok=True)

img.save("sample-data/sample_scanned_invoice.png")
img.save("client/public/sample_scanned_invoice.png")

print("Successfully generated sample-data/sample_scanned_invoice.png & client/public/sample_scanned_invoice.png!")
