import pandas as pd

# Load Excel file
file_path = '2023_County.xlsx'  # Replace with your actual file path
df = pd.read_excel(file_path)

# Randomly sample 30% of the data for training
train_df = df.sample(frac=0.3, random_state=42)

# Create a test set with the remaining 70%
test_df = df.drop(train_df.index)

train_df.to_csv('county_training_data.csv', index=False)
test_df.to_csv('county_test_data.csv', index=False)

print("Training and test files have been created.")
