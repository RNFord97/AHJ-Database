import pandas as pd

# Load Excel file
file_path = '2023_City.xlsx'  # Replace with your actual file path
df = pd.read_excel(file_path)

# Randomly sample 30% of the data for training
train_df = df.sample(frac=0.3, random_state=42)

# Create a test set with the remaining 70%
test_df = df.drop(train_df.index)

train_df.to_excel('city_training_data.xlsx', index=False)
test_df.to_excel('city_test_data.xlsx', index=False)

print("Training and test files have been created.")
