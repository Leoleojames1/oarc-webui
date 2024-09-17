# Ollamafy - Automate Model Quantization and Deployment with Ollama

`ollamafy.sh` is a shell script designed to streamline the process of creating, quantizing, and pushing models to Ollama using the `ollama` CLI tool. It supports multiple quantization methods and allows for easy tagging and versioning of your models.

## How to Use

### Command-Line Options:
The script accepts several options to customize the quantization, model details, and other parameters:

| Option              | Description                                                                                           | Required |
|---------------------|-------------------------------------------------------------------------------------------------------|----------|
| `-q` or `--quant`   | Specify a quantization method (e.g., q4_0, q5_1, fp16, etc.).                                          | No       |
| `-u` or `--username`| Your username on Ollama.                                                                               | Yes      |
| `-m` or `--model`   | The name of the model.                                                                                 | Yes      |
| `-v` or `--version` | Specify the version of the model.                                                                      | No       |
| `-p` or `--parameters` | Additional parameters to include in the model tag.                                                   | No       |
| `-l` or `--latest`  | Specify which quantization should be tagged as the "latest".                                            | No       |
| `-f` or `--file`    | Path to the model file.                                                                                | Yes      |

### Example Commands:

#### 1. Simple Usage with Default Quantizations:
```bash
./ollamafy.sh -u myusername -m mymodel -f model_file.bin