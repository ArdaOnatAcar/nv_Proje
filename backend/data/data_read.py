import pandas as pd 
import json
import os

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, 'il_ilce.csv')

def get_data():
    data_df = pd.read_csv(csv_path)
    data_df = data_df.groupby('il')['ilce'].apply(list).reset_index(name='ilceler')
    districts = dict(zip(data_df['il'], data_df['ilceler']))
    cities = data_df['il'].tolist()
    return cities, districts

def get_cities_json():
    cities, _ = get_data()
    return json.dumps(cities, ensure_ascii=False)

def get_districts_json():
    _, districts = get_data()
    return json.dumps(districts, ensure_ascii=False)

if __name__ == "__main__":
    print(get_cities_json())
    print(get_districts_json())