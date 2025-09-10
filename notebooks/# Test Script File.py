import geopandas as gpd
import matplotlib.pyplot as plt
import numpy as np
from collections import Counter

# List of jurisdictions with participant counts
jurisdictions = [
    "Murrieta", "San Diego", "El Centro", "Hayward", "Los Angeles", "Eureka", "San Marcos", "Santa Barbara County",
    "Wasco", "Redding", "Garden Grove", "Newport Beach", "Wildomar", "Palo Alto", "El Dorado County", "Santa Maria",
    "San Francisco", "Berkeley", "Pomona", "Turlock", "Half Moon Bay", "Los Altos Hills", "Davis", "Dixon",
    "San Bernardino", "Tiburon", "Pismo Beach", "Folsom", "Riverside", "Orland"
]

# Count the occurrences of each jurisdiction
jurisdiction_counts = Counter(jurisdictions)

# Load a map of California using GeoPandas
world = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))
california = world[world.name == "California"]

# Plot the base map of California
fig, ax = plt.subplots(figsize=(10, 12))
california.plot(ax=ax, color='lightgrey')

# Add a simple color-coding scheme for the jurisdictions
color_map = plt.cm.get_cmap('viridis', len(jurisdiction_counts))  # Use a colormap with distinct colors
color_dict = {jurisdiction: color_map(i) for i, jurisdiction in enumerate(jurisdiction_counts)}

# Just a simple representation as placeholders (no actual geometry of cities included in this plot)
# We can represent the jurisdictions as dots with colors corresponding to their counts
# For now, I will plot random points for demonstration

# Random coordinates for demonstration (in actual use, you'd want precise lat/lon for each city)
np.random.seed(42)
locations = {
    "Murrieta": (33.5806, -117.1896),
    "San Diego": (32.7157, -117.1611),
    "El Centro": (32.7920, -115.5636),
    "Hayward": (37.6688, -122.0808),
    "Los Angeles": (34.0522, -118.2437),
    "Eureka": (40.8021, -124.1637),
    "San Marcos": (33.1434, -117.1661),
    "Santa Barbara County": (34.4208, -119.6982),
    "Wasco": (35.5923, -119.3530),
    "Redding": (40.5865, -122.3917),
    "Garden Grove": (33.7739, -117.9415),
    "Newport Beach": (33.6189, -117.9292),
    "Wildomar": (33.5800, -117.1803),
    "Palo Alto": (37.4419, -122.1430),
    "El Dorado County": (38.7345, -120.5359),
    "Santa Maria": (34.9592, -120.4357),
    "San Francisco": (37.7749, -122.4194),
    "Berkeley": (37.8715, -122.2730),
    "Pomona": (34.0551, -117.7498),
    "Turlock": (37.4957, -120.8490),
    "Half Moon Bay": (37.4636, -122.4287),
    "Los Altos Hills": (37.3958, -122.1276),
    "Davis": (38.5449, -121.7405),
    "Dixon": (38.4470, -121.8359),
    "San Bernardino": (34.1083, -117.2898),
    "Tiburon": (37.8593, -122.4469),
    "Pismo Beach": (35.1437, -120.6439),
    "Folsom": (38.6779, -121.1761),
    "Riverside": (33.9806, -117.3755),
    "Orland": (39.7702, -122.1861)
}

# Plot jurisdictions with color based on participant count
for jurisdiction, (lat, lon) in locations.items():
    count = jurisdiction_counts.get(jurisdiction, 0)
    color = color_dict.get(jurisdiction, 'grey')  # Get the color for the jurisdiction
    ax.scatter(lon, lat, color=color, s=100, label=jurisdiction, alpha=0.7)

# Add title and labels
ax.set_title('California Jurisdictions with Participant Counts', fontsize=16)
plt.legend(loc='upper right', fontsize=8, title="Jurisdictions")

# Show the map
plt.show()
