from mmdet.apis import init_detector, inference_detector, show_result_pyplot
import mmcv
import json
import pytesseract
from PIL import Image
import easyocr

# Load model
config_file = 'cascade_mask_rcnn_hrnetv2p_w32_20e.py'
checkpoint_file = '/content/drive/My Drive/torch/tableTrained/epoch_195_converted_V2.pth'
model = init_detector(config_file, checkpoint_file, device='cpu')

# Test a single image 


image_path = '/content/313.jpg' #оак5???  35???
_image = image_to_numpy.load_image_file(image_path, mode="RGB")
image = np.copy(_image)
if image.shape[1]> image.shape[0]:
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
#show_bboxes(image_copy_test, np.array(bboxes), 0.65, (255,0,0))
first_column, second_column = structure_cells(image, cells, table)


first_column = sort_column(first_column)

second_column = sort_column(second_column)
#first_column, second_column = postfilterByCentresZero(first_column, second_column)

image_copy_first = np.copy(image)
image_copy_second = np.copy(image)
#
#first_column = first_column[:6, :]
#

mean_cell_size(first_column, second_column)
min_height, max_height = min_max_height(first_column, second_column)

first_column, second_column = restore_missed_cells(first_column, second_column, min_height, max_height, table, 'both')
first_column, second_column = postfilterByCentresZero(first_column, second_column)
first_column, second_column = postfilterByCentres(first_column, second_column)
first_column, second_column = postSmoothSecColumn(first_column, second_column)
#show_bboxes(image_copy_first, first_column, 0.65, (255,0,0))
#show_bboxes(image_copy_second, second_column, 0.65, (0,0,255))

#print('a ', first_column.shape[0])
#print('b ', second_column.shape[0])

#show_result_pyplot(model, img, result, score_thr=0.65)


cropped_for_test = image[int(first_column[2][1]):int(first_column[2][3]), int(first_column[2][0]):int(first_column[2][2])]
cropped_for_test = cv.resize(cropped_for_test, (cropped_for_test.shape[1]*3, cropped_for_test.shape[0]*3))
cv2_imshow(cropped_for_test)

reader = easyocr.Reader(['ru']) # need to run only once to load model into memory

#txt = reader.readtext(cropped_for_test, detail = 0)
#txt = reader.recognize(cropped_for_test, detail = 0, allowlist=',.0123456789<>=*')
first_column_text = []
second_column_text = []
for iter in range(first_column.shape[0]):
  cropped_left = image[int(first_column[iter][1]):int(first_column[iter][3]), int(first_column[iter][0]):int(first_column[iter][2])]
  cropped_right = image[int(second_column[iter][1]):int(second_column[iter][3]), int(second_column[iter][0]):int(second_column[iter][2])]
  txt = pytesseract.image_to_string(Image.fromarray(cropped_left), lang='rus+eng', config="-c tessedit_char_whitelist=абвгдеёжзийклмнопрстуфхцчщъьэюяabcdefghijklmnopqrstuvwxyz" )
  txt2 = reader.recognize(cropped_right, detail = 0, allowlist='абвгдеёжзийклмнопрстуфхцчщъьыюя,.0123456789<>=*')
  txt = txt.replace('|','').strip()
  if len(txt) == 0:
    txt = 'Текст не распознан'
  first_column_text.append(txt)
  second_column_text.append(txt2[0])
  print(f'{txt} - {txt2[0]}')



data = json.loads('{}')
data['columnFirst'] = first_column_text
data['columnSecond'] = second_column_text
print(data)
