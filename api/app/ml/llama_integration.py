import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

HUGGING_FACE_API_TOKEN = os.getenv("HUGGING_FACE_API_TOKEN")

def analyze_transaction(transaction_details):
    try:
        from transformers import GPT2Tokenizer, GPT2LMHeadModel
        import torch

        # Initialize tokenizer and model
        tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        model = GPT2LMHeadModel.from_pretrained("gpt2")

        prompt = f"Analyze this transaction for potential fraud:\n{transaction_details}\nIs this transaction likely to be fraudulent? Respond with 'Yes' or 'No' and provide a brief explanation."

        inputs = tokenizer(prompt, return_tensors="pt")
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=200)

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)

        is_fraudulent = "Yes" in response.split("\n")[0]
        explanation = "\n".join(response.split("\n")[1:])

        return is_fraudulent, explanation

    except ImportError:
        print("Error: Required libraries not found. Make sure transformers and torch are installed.")
        return False, "Error: Unable to analyze transaction due to missing libraries."
    except Exception as e:
        print(f"Error in analyze_transaction: {str(e)}")
        return False, f"Error analyzing transaction: {str(e)}"
