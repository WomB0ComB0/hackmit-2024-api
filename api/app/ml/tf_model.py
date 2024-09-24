import tensorflow as tf
import numpy as np
import pandas as pd
import os

MODEL_PATH = 'app/ml/tf_model.h5'

def create_and_train_model(X, y):
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(6,)),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    model.fit(X, y, epochs=10, batch_size=32, validation_split=0.2)
    
    model.save(MODEL_PATH)
    return model

def load_model():
    return tf.keras.models.load_model(MODEL_PATH)

def predict_fraud_tf(features):
    model = load_model()
    prediction = model.predict(np.array([features]))
    return prediction[0][0] > 0.5

# Train the model if it doesn't exist
if not os.path.exists(MODEL_PATH):
    # Load your data from CSV files
    X = pd.read_csv('data/csv/X_train.csv')
    y = pd.read_csv('data/csv/y_train.csv')
    
    create_and_train_model(X, y)