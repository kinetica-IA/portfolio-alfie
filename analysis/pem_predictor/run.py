from analysis.pem_predictor.l4_diary_join import run as diary_join
from analysis.pem_predictor.l5_retrain import run as retrain
from analysis.pem_predictor.l5_publish import run as publish

if __name__ == "__main__":
    diary_join()
    retrain()
    publish()
