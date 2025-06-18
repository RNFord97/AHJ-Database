# Test Script File
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import re

# Step 1: Load personnel data
personnel_df = pd.read_excel("Composite Position Search Results.xlsx", sheet_name="F_Composite Position Search")

# Step 2: Classify agency type
def classify_agency(agency):
    agency_lower = str(agency).lower()
    if 'county' in agency_lower or 'sheriff' in agency_lower:
        return 'county'
    elif 'city of' in agency_lower:
        return 'city'
    else:
        return 'city'

personnel_df['type'] = personnel_df['Agency'].apply(classify_agency)

# Step 3: Clean names
def clean_name(name):
    name = str(name).lower()
    name = re.sub(r'county|city of|sheriff|department|dept|agency|office', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name.strip().title()

personnel_df['clean_name'] = personnel_df['Agency'].apply(clean_name)

# Step 4: Ensure 'Total Pay' is numeric
personnel_df['Total Pay'] = pd.to_numeric(personnel_df['Total Pay'], errors='coerce').fillna(0)

# Step 5: Aggregate personnel count and total pay
agg_data = (
    personnel_df
    .groupby(['clean_name', 'type'])
    .agg(personnel_count=('Employee Name', 'count'),
         total_pay=('Total Pay', 'sum'))
    .reset_index()
)

# Step 6: Load combined GeoJSON with CITY and COUNTY columns
geo_df = gpd.read_file("City_and_County_Boundary_Line_Changes_5487330134999085531.geojson")

# Step 7: Split into city and county GeoDataFrames
geo_city = geo_df.copy()
geo_county = geo_df.copy()

geo_city['clean_name'] = geo_city['CITY'].apply(lambda x: clean_name(str(x)))
geo_city['type'] = 'city'

geo_county['clean_name'] = geo_county['COUNTY'].apply(lambda x: clean_name(str(x)))
geo_county['type'] = 'county'

# Step 8: Merge personnel data
geo_city = geo_city.merge(
    agg_data[agg_data['type'] == 'city'],
    on=['clean_name', 'type'],
    how='left'
)

geo_county = geo_county.merge(
    agg_data[agg_data['type'] == 'county'],
    on=['clean_name', 'type'],
    how='left'
)

# Fill missing values
geo_city[['personnel_count', 'total_pay']] = geo_city[['personnel_count', 'total_pay']].fillna(0)
geo_county[['personnel_count', 'total_pay']] = geo_county[['personnel_count', 'total_pay']].fillna(0)

# Step 9: Plot overlay map
fig, ax = plt.subplots(1, 1, figsize=(14, 14))

# Plot county layer (total pay)
geo_county.plot(
    column='total_pay',
    cmap='OrRd',
    linewidth=0.5,
    edgecolor='black',
    legend=True,
    legend_kwds={'label': "Total Pay (County)", 'shrink': 0.5},
    ax=ax,
    alpha=0.6
)

# Plot city layer (personnel count)
geo_city.plot(
    column='personnel_count',
    cmap='YlGnBu',
    linewidth=0.5,
    edgecolor='black',
    legend=True,
    legend_kwds={'label': "Personnel Count (City)", 'shrink': 0.5},
    ax=ax,
    alpha=0.5
)

ax.set_title("Overlay: County Total Pay and City Personnel Count", fontsize=16)
ax.axis('off')
plt.tight_layout()
plt.show()
