import matplotlib as mpl
mpl.use('Agg')
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yaml

from time import gmtime, strftime, localtime
from jinja2 import Environment, FileSystemLoader

with open('../config/betfair_config.yml', 'r') as f:
    doc = yaml.load(f)
    data_dir = doc['default']['betfair']['data_dir']

todays_date = strftime('%Y-%-m-%d', gmtime())

env = Environment(loader=FileSystemLoader('.'))
template = env.get_template('report.html')

markets = pd.read_csv(data_dir + '/data/' + todays_date+ '/markets.csv',dtype={'marketId':str})
scatter = pd.read_csv(data_dir + '/data/' + todays_date+ '/scatter.csv', header=None)
matched = pd.read_csv(data_dir + '/data/' + todays_date+ '/matched.csv', dtype={'marketId':str})
under_over_25 = pd.read_csv(data_dir + '/data/' + todays_date+ '/under-over-25.csv')


matched_dist_df = matched[['distance','totalMatched']]
matched_dist = matched_dist_df.plot(x='distance',kind='bar')

matched_df = matched[['course','totalMatched']]
matched_time_and_value = matched_df.plot(x='course',kind='bar')

distance_and_runners_df = markets[['distance','runners']]
distance_and_runners = distance_and_runners_df.plot(kind='bar')


df_matched_pivot = pd.pivot_table(matched,index=["course"],values=["totalMatched"],aggfunc=np.sum)

template_vars = {'title' : 'Market Report - ' + strftime('%Y-%m-%d %H:%M:%S', localtime()),
                 'race_list': markets.to_html(),
                 'under_over_25': under_over_25.to_html(),
                 'summary': markets.describe().to_html(),
                 'matched_bets' : matched.to_html(),
                 'matched_bets_total' : df_matched_pivot.to_html()}

html_out = template.render(template_vars)

distance_and_runners.get_figure().savefig('/tmp/distance-and-runners.png')
matched_time_and_value.get_figure().savefig('/tmp/matched-bets.png')
matched_dist.get_figure().savefig('/tmp/matched-dist-bets.png')

fig, ax = plt.subplots()

ax.set_title('RACES',fontsize=14)
ax.set_xlabel('DISTANCE',fontsize=12)
ax.set_ylabel('RUNNERS',fontsize=12)
ax.grid(True,linestyle='-',color='0.75')

yActA = np.random.randn(10)

colors = np.random.rand(20)
ax.scatter(scatter[0], scatter[1], c=scatter[0] , s=100 * scatter[2], alpha=0.5)

ax.legend(numpoints=1, loc='upper left')

fig.savefig('/tmp/distance-and-runners-scatter.png', dpi=100)

print(html_out)
