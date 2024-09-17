import convex

# Load Convex API token from environment (or directly in code)
convex_url = "https://benevolent-manatee-676.convex.cloud"
convex_token = "benevolent-manatee-676|eyJ2MiI6IjIzODdmYTMxM2Q3YzQxNjk4MTllY2VhOGU2MDc0NTAzIn0="

# Connect to Convex using the correct client initialization
convex_client = convex.Connection(address=convex_url, token=convex_token)

# Assuming you're using the Convex vector search API, initialize the search index
index = convex_client.vector.create_index("transactions")

# Load vectors from JSON file
import json
import numpy as np

with open("transaction_vectors.json", "r") as json_file:
    transaction_vectors = json.load(json_file)

# Upload each transaction vector to the Convex search index
for transaction in transaction_vectors:
    transaction_id = transaction["_id"]
    vector = np.array(transaction["vector"])  # Convert list back to NumPy array

    # Insert the vector into the index with the associated transaction ID
    index.insert(vector, metadata={"_id": transaction_id})

print("All transaction vectors have been loaded into Convex.")