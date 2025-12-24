import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report

def train_prediction_models():
    # 1. Load Data
    try:
        df = pd.read_csv('cattle_data.csv')
    except FileNotFoundError:
        print("Error: 'cattle_data.csv' not found. Run generate_data.py first.")
        return

    print(f"Loaded {len(df)} records.")

    # 2. Preprocessing Setup
    # Features used for prediction
    cat_features = ['Breed', 'Lactation_Stage', 'Feed_Type', 'Season', 'Housing_Quality', 'Vaccination_Status']
    num_features = ['Age', 'Weight', 'Parity', 'Feed_Quantity', 'Protein_Content', 
                    'Walking_Distance', 'Grazing_Duration', 'Rumination_Time', 'Rest_Hours',
                    'Body_Temperature', 'Heart_Rate', 'Temperature', 'Humidity']

    # Define Transformers
    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_features),
            ('cat', categorical_transformer, cat_features)
        ])

    # --- MODEL 1: Milk Yield Prediction (Regression) ---
    print("\n--- Training Milk Yield Model (Regression) ---")
    X = df.drop(columns=['Animal_ID', 'Milk_Yield', 'Disease_Label'])
    y_yield = df['Milk_Yield']

    X_train, X_test, y_train, y_test = train_test_split(X, y_yield, test_size=0.2, random_state=42)

    yield_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])

    yield_model.fit(X_train, y_train)
    
    # Evaluation
    preds = yield_model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    print(f"Milk Yield RMSE: {rmse:.2f} liters")

    # Save Model
    with open('yield_model.pkl', 'wb') as f:
        pickle.dump(yield_model, f)
    print("Saved yield_model.pkl")


    # --- MODEL 2: Disease Detection (Classification) ---
    print("\n--- Training Disease Detection Model (Classification) ---")
    # We use the same X features
    y_disease = df['Disease_Label']

    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X, y_disease, test_size=0.2, random_state=42, stratify=y_disease)

    disease_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    disease_model.fit(X_train_d, y_train_d)

    # Evaluation
    preds_d = disease_model.predict(X_test_d)
    acc = accuracy_score(y_test_d, preds_d)
    print(f"Disease Accuracy: {acc*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test_d, preds_d))

    # Save Model
    with open('disease_model.pkl', 'wb') as f:
        pickle.dump(disease_model, f)
    print("Saved disease_model.pkl")

if __name__ == "__main__":
    train_prediction_models()
