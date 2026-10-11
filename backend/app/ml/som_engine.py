import numpy as np
from minisom import MiniSom
from typing import Dict, Any, List, Tuple

def train_som_model(
    scaled_data: np.ndarray,
    grid_width: int = 10,
    grid_height: int = 10,
    learning_rate: float = 0.5,
    iterations: int = 10000,
    neighborhood_func: str = "gaussian", # "gaussian", "bubble"
    seed: int = 42
) -> Dict[str, Any]:
    """
    Trains a Self-Organizing Map on scaled customer feature matrix.
    Computes Quantization Error, Topographic Error, U-Matrix distance matrix,
    and Best Matching Unit (BMU) coordinates for each input sample.
    """
    input_len = scaled_data.shape[1]
    n_samples = scaled_data.shape[0]
    
    # Initialize MiniSom
    som = MiniSom(
        x=grid_width,
        y=grid_height,
        input_len=input_len,
        sigma=max(grid_width, grid_height) / 2.0,
        learning_rate=learning_rate,
        neighborhood_function=neighborhood_func,
        random_seed=seed
    )
    
    # Initialize weights with PCA if samples > input_len, else random
    if n_samples >= input_len:
        try:
            som.pca_weights_init(scaled_data)
        except Exception:
            som.random_weights_init(scaled_data)
    else:
        som.random_weights_init(scaled_data)
        
    # Train
    som.train_batch(scaled_data, iterations, verbose=False)
    
    # Calculate SOM Evaluation Metrics
    quant_error = float(np.round(som.quantization_error(scaled_data), 4))
    topog_error = float(np.round(som.topographic_error(scaled_data), 4))
    
    # Compute U-Matrix (distance_map returns 2D array of shape (grid_width, grid_height))
    umatrix = som.distance_map()
    umatrix_list = umatrix.tolist() # [[float, ...], ...]
    
    # Codebook weights
    weights = som.get_weights() # shape (grid_width, grid_height, input_len)
    
    # Map samples to BMU
    bmu_results = []
    node_customer_counts = np.zeros((grid_width, grid_height), dtype=int)
    
    for idx in range(n_samples):
        sample = scaled_data[idx]
        bmu_x, bmu_y = som.winner(sample)
        neuron_weight = weights[bmu_x, bmu_y]
        dist = float(np.linalg.norm(sample - neuron_weight))
        
        node_customer_counts[bmu_x, bmu_y] += 1
        
        bmu_results.append({
            "index": idx,
            "bmu_x": int(bmu_x),
            "bmu_y": int(bmu_y),
            "distance": float(np.round(dist, 4))
        })
        
    return {
        "som_instance": som,
        "grid_width": grid_width,
        "grid_height": grid_height,
        "learning_rate": learning_rate,
        "iterations": iterations,
        "neighborhood_func": neighborhood_func,
        "quantization_error": quant_error,
        "topographic_error": topog_error,
        "umatrix": umatrix_list,
        "node_counts": node_customer_counts.tolist(),
        "weights": weights.tolist(),
        "bmu_results": bmu_results
    }
