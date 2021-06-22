from mmdet.apis import init_detector, inference_detector
import json
import pytesseract
from PIL import Image
import easyocr
import image_to_numpy
import numpy as np
import cv2 as cv
import re
from utils import filterByThreshold, find_table_and_cells, structure_cells, sort_column, mean_cell_size, min_max_height, restore_missed_cells,\
    postfilterByCentresZero, postfilterByCentres, postSmoothSecColumn

# Load model
config_file = 'cascade_mask_rcnn_hrnetv2p_w32_20e.py'
checkpoint_file = 'epoch_195_converted_V2.pth'
model = init_detector(config_file, checkpoint_file, device='cpu')

# Test a single image
image_path = './1.jpg'
result_path = './result.json'


_image = image_to_numpy.load_image_file(image_path, mode="RGB")
image = np.copy(_image)
if image.shape[1] > image.shape[0]:
    image = cv.rotate(image, cv.ROTATE_90_COUNTERCLOCKWISE)
image = cv.cvtColor(image, cv.COLOR_RGB2BGR)

# Run Inference
result = inference_detector(model, image)
# Visualization results
bbox_result, segm_result = result
bboxes = filterByThreshold(np.vstack(bbox_result), 0.65)
full = np.copy(image)
table, cells = find_table_and_cells(bboxes)
image_copy_test = np.copy(image)
first_column, second_column = structure_cells(image, cells, table)


first_column = sort_column(first_column)

second_column = sort_column(second_column)

image_copy_first = np.copy(image)
image_copy_second = np.copy(image)


mean_cell_size(first_column, second_column)
min_height, max_height = min_max_height(first_column, second_column)

first_column, second_column = restore_missed_cells(
    first_column, second_column, min_height, max_height, table, 'both')
first_column, second_column = postfilterByCentresZero(
    first_column, second_column)
first_column, second_column = postfilterByCentres(first_column, second_column)
first_column, second_column = postSmoothSecColumn(first_column, second_column)


# need to run only once to load model into memory
reader = easyocr.Reader(['ru'])


first_column_text = []
second_column_text = []
for iter in range(first_column.shape[0]):
    cropped_left = image[int(first_column[iter][1]):int(
        first_column[iter][3]), int(first_column[iter][0]):int(first_column[iter][2])]

    cropped_right = image[int(second_column[iter][1]):int(
        second_column[iter][3]), int(second_column[iter][0]):int(second_column[iter][2])]
    txt = pytesseract.image_to_string(Image.fromarray(cropped_left), lang='rus+eng',
                                      config="-c tessedit_char_whitelist=АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧЩЪЬЫЭЮЯабвгдеёжзийклмнопрстуфхцчщъьэюяabcdefghijklmnopqrstuvwxyz-12")

    txt2 = reader.recognize(
        cropped_right, detail=0, allowlist='абвгдеёжзийклмнопрстуфхцчщъьэюя.0123456789*')

    txt = txt.replace('|', '').strip()
    if len(txt) == 0:
        txt = 'Текст не распознан'
    first_column_text.append(txt)
    second_column_text.append(txt2[0])


data = json.loads('{}')
data['columnFirst'] = first_column_text
data['columnSecond'] = second_column_text

with open(result_path, 'w') as outfile:
    json.dump(data, outfile)
