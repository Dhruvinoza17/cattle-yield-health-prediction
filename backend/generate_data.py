import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_cattle_data(num_samples=500):
    """
    Generates a synthetic dataset for cattle milk yield and disease prediction.
    """
    
    # Seeds for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    breeds = ['Holstein', 'Jersey', 'Murrah Buffalo', 'Gir', 'Sahiwal']
    feed_types = ['Green Fodder', 'Dry Fodder', 'Mixed Ration', 'Silage', 'Concentrates']
    housing_conds = ['Well Ventilated', 'Average', 'Poor']
    seasons = ['Winter', 'Summer', 'Monsoon', 'Spring']
    
    data = []
    
    # Create weighted list for disease types to ensure representation
    # 0: Healthy, 1: Mastitis, 2: Digestive, 3: Heat Stress
    # We force at least 5 of each disease type in the dataset
    
    for i in range(num_samples):
        # ... existing animal data ...
        animal_id = f"CATTLE_{1000 + i}"
        breed = random.choice(breeds)
        
        # Breed specific baselines for yield
        if breed == 'Holstein': base_yield = 25
        elif breed == 'Jersey': base_yield = 18
        elif breed == 'Murrah Buffalo': base_yield = 12
        else: base_yield = 10
        
        age = random.randint(24, 120) 
        weight = np.random.normal(450, 50) 
        lactation_stage = random.choice(['Early', 'Peak', 'Mid', 'Late', 'Dry'])
        parity = random.randint(1, 8)
        
        # ... Feed ...
        feed_type = random.choice(feed_types)
        feed_quantity = np.random.normal(15, 3)
        protein_content = np.random.normal(14, 2)
        
        # ... Activity ...
        walking = np.random.normal(2, 1)
        grazing = np.random.normal(4, 1.5)
        rumination = np.random.normal(7, 1)
        rest_hours = np.random.normal(10, 2)
        
        # ... Env ...
        season = random.choice(seasons)
        temp = np.random.normal(25, 5)
        humidity = np.random.normal(60, 15)
        housing = random.choice(housing_conds)
        
        # ... Health ...
        body_temp = np.random.normal(38.5, 0.5)
        heart_rate = np.random.normal(60, 10)
        vaccination = random.choice(['Vaccinated', 'Pending', 'Overdue'])
        
        # --- Disease Logic ---
        disease_label = 'Healthy'
        milk_yield_factor = 1.0
        
        # FORCED DISTRIBUTION (First 20 samples guarantee coverage)
        if i < 5:
            disease_label = 'Mastitis'
            body_temp = 40.5
            milk_yield_factor = 0.5
        elif i < 10:
            disease_label = 'Digestive Disorder'
            rumination = 3.0
            milk_yield_factor = 0.7
        elif i < 15:
            disease_label = 'Heat Stress'
            temp = 38.0
            humidity = 85.0
            milk_yield_factor = 0.8
        else:
            # Random probabilistic logic for the rest
            if random.random() < 0.15: 
                 if body_temp > 39.5 or housing == 'Poor':
                     disease_label = 'Mastitis'
                     milk_yield_factor = 0.6
            elif rumination < 5 and feed_type == 'Dry Fodder':
                disease_label = 'Digestive Disorder'
                milk_yield_factor = 0.8
            elif temp > 35 and humidity > 70:
                disease_label = 'Heat Stress'
                milk_yield_factor = 0.85
                heart_rate += 15

        if lactation_stage == 'Dry':
            milk_yield_factor = 0.0
            
        yield_noise = np.random.normal(0, 1.5)
        final_yield = (base_yield * milk_yield_factor) + (feed_quantity * 0.2) + (rumination * 0.1) + yield_noise
        if lactation_stage == 'Peak': final_yield *= 1.2
        final_yield = max(0, round(final_yield, 2))
        
        data.append([
            animal_id, breed, age, weight, lactation_stage, parity,
            feed_type, feed_quantity, protein_content,
            walking, grazing, rumination, rest_hours,
            body_temp, heart_rate, vaccination,
            temp, humidity, season, housing,
            final_yield, disease_label
        ])
        
    # Create DataFrame
    columns = [
        'Animal_ID', 'Breed', 'Age', 'Weight', 'Lactation_Stage', 'Parity',
        'Feed_Type', 'Feed_Quantity', 'Protein_Content',
        'Walking_Distance', 'Grazing_Duration', 'Rumination_Time', 'Rest_Hours',
        'Body_Temperature', 'Heart_Rate', 'Vaccination_Status',
        'Temperature', 'Humidity', 'Season', 'Housing_Quality',
        'Milk_Yield', 'Disease_Label'
    ]
    
    df = pd.DataFrame(data, columns=columns)
    
    # Save
    output_path = 'cattle_data.csv'
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} records. Saved to {output_path}")
    print(df['Disease_Label'].value_counts())

if __name__ == "__main__":
    generate_cattle_data()
