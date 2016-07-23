import yaml
from time import gmtime, strftime
from shutil import copy

with open('../config/betfair_config.yml', 'r') as f:
    doc = yaml.load(f)

data_dir = doc['default']['betfair']['data_dir']
todays_date = strftime('%Y-%-m-%d', gmtime())

src='/tmp/market-report.pdf'
dest=data_dir + '/data/' + todays_date + '/market-report.pdf'

png_src='/tmp/distance-and-runners-scatter.png'
png_dest=data_dir + '/data/' + todays_date + '/distance-and-runners-scatter.png'

copy(src,dest)
copy(png_src,png_dest)
