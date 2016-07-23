python3 daily-market-report.py > /tmp/out-temp.html
wkhtmltopdf /tmp/out-temp.html /tmp/market-report.pdf
python3 copy-market-report.py
