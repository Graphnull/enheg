import cv2 as cv
import networkx as nx
import numpy as np


def show_bboxes(image, bboxes, score, color):
    if score > 0:
        scores = bboxes[:, -1]
        inds = scores > score
        bboxes = bboxes[inds, :]

    text_color = (255, 0, 0)

    for bbox in bboxes:
        bbox_int = bbox.astype(np.int32)
        left_top = (bbox_int[0], bbox_int[1])
        right_bottom = (bbox_int[2], bbox_int[3])
        cv.rectangle(
            image, left_top, right_bottom, color, 2)
        label_text = 'aaa'
        if len(bbox) > 4:
            label_text += f'|{bbox[-1]:.02f}'
        cv.putText(image, label_text, (bbox_int[0], bbox_int[1] - 2),
                   cv.FONT_HERSHEY_COMPLEX, 0.1, text_color)
    # cv2_imshow(image)


def find_table_and_cells(bboxes):
    areas = (bboxes[:, 2] - bboxes[:, 0]) * (bboxes[:, 3] - bboxes[:, 1])
    table_index = np.argmax(areas)
    table = bboxes[table_index]
    cells = np.delete(bboxes, table_index, 0)
    return table, cells


def show_table(image, table):
    left_top = (int(table[0]), int(table[1]))
    right_bottom = (int(table[2]), int(table[3]))
    cv.rectangle(image, left_top, right_bottom, (0, 255, 0), 2)
    cv2_imshow(image)


def smooth_width(column):
    min_X = np.mean(column[:, 0:1].flatten())
    result = []
    for cell in column:
        result.append([cell[0], cell[1], cell[2], cell[3]])
        #result.append([min_X, cell[1], cell[2], cell[3]])
    return np.array(result)


def structure_cells(image, _cells, table):
    min_x_of_first_column = image.shape[1]
    minbox = 0
    cells = np.copy(_cells)

    for box in cells:
        if box[0] < min_x_of_first_column and box[0] > table[0]:
            min_x_of_first_column = box[0]
            minbox = box

    first_column = []
    indexes_to_delete = []

    indexes_to_delete_with_table = []
    for index in range(len(cells)):
        if (cells[index][2]-cells[index][0])*2/3+cells[index][0] < table[0]:
            indexes_to_delete_with_table.append(index)

    cells = np.delete(cells, indexes_to_delete_with_table, 0)

    for index in range(len(cells)):
        if cells[index][0] < (minbox[2] - minbox[0])*2/3 + minbox[0]:
            first_column.append(cells[index])
            indexes_to_delete.append(index)
    cells = np.delete(cells, indexes_to_delete, 0)

    min_x_of_second_column = image.shape[1]
    minbox_second = 0
    for cell in cells:
        if cell[0] < min_x_of_second_column:
            min_x_of_second_column = cell[0]
            minbox_second = cell

    second_column = []
    for index in range(len(cells)):
        if cells[index][0] < (minbox_second[2] - minbox_second[0])*2/3 + minbox_second[0]:
            second_column.append(cells[index])
    return smooth_width(np.array(first_column)), smooth_width(np.array(second_column))


def filterByThreshold(bboxes, threshold):
    result = []
    for box in bboxes:
        if box[4] > threshold:
            result.append(box)
    return np.array(result)


def mean_cell_size(first_column, second_column):
    first_column_mean_height = first_column[:, 3] - first_column[:, 1]
    first_column_mean_height = first_column_mean_height.mean(axis=0)

    second_column_mean_height = second_column[:, 3] - second_column[:, 1]
    second_column_mean_height = second_column_mean_height.mean(axis=0)

    first_column_mean_width = first_column[:, 2] - first_column[:, 0]
    first_column_mean_width = first_column_mean_width.mean(axis=0)

    second_column_mean_width = second_column[:, 2] - second_column[:, 0]
    second_column_mean_width = second_column_mean_width.mean(axis=0)
    return first_column_mean_height, first_column_mean_width, second_column_mean_height, second_column_mean_width


def min_max_height(first_column, second_column):
    arg_min_first = first_column[np.argmin(first_column[:, 1])][1]
    arg_min_second = second_column[np.argmin(second_column[:, 1])][1]

    arg_max_first = first_column[np.argmax(first_column[:, 3])][3]
    arg_max_second = second_column[np.argmax(second_column[:, 3])][3]

    argmin = 0
    argmax = 0
    if arg_min_first < arg_min_second:
        argmin = arg_min_first
    else:
        argmin = arg_min_second

    if arg_max_first > arg_max_second:
        argmax = arg_max_first
    else:
        argmax = arg_max_second

    return argmin, argmax


def cells_centers(column):
    result = ((column[:, 3] - column[:, 1])/2) + column[:, 1]
    return result


def center_condition_of_missing_cell(column, center):
    for cell in column:
        if center < cell[3] and center > cell[1]:
            return True
    return False


def find_mean_gap(first_column, second_column):
    fc_mean_height, fc_mean_width, sc_mean_height, sc_mean_width = mean_cell_size(
        first_column, second_column)
    gaps_first = []
    gaps_second = []
    for iter in range(first_column.shape[0]-1):
        gap = abs(first_column[iter][3] - first_column[iter+1][1])
        if gap < fc_mean_height:
            gaps_first.append(gap)
        else:
            break

    for iter in range(second_column.shape[0]-1):
        gap = abs(second_column[iter][3] - second_column[iter+1][1])
        if gap < sc_mean_height:
            gaps_second.append(gap)
        else:
            break
    gap_first = np.average(gaps_first)
    gap_second = np.average(gaps_second)
    return gap_first, gap_second


def restore_missed_cells(column_first, column_second, min_height, max_height, table, mode):
    fc_mean_height, fc_mean_width, sc_mean_height, sc_mean_width = mean_cell_size(
        column_first, column_second)
    restored_first = np.copy(column_first)
    restored_second = np.copy(column_second)
    gap_first, gap_second = find_mean_gap(column_first, column_second)
    if mode == 'second' or mode == 'both':
        for iter in range(restored_second.shape[0]-1):
            if abs(restored_second[iter][3] - restored_second[iter+1][1]) > sc_mean_height/3:
                phantom_box = [restored_second[iter][0], restored_second[iter][3]-gap_second,
                               restored_second[iter][0] + sc_mean_width, restored_second[iter][3] + sc_mean_height - gap_second]
                if phantom_box[1] >= table[1] and phantom_box[2] <= table[2] and phantom_box[3] <= table[3] + sc_mean_height/3 and center_condition_of_missing_cell(restored_first, (phantom_box[3]-phantom_box[1])/2+phantom_box[1]):
                    restored_second = np.insert(
                        restored_second, iter+1, phantom_box, axis=0)
                    restored_first, restored_second = restore_missed_cells(
                        restored_first, restored_second, min_height, max_height, table, 'second')
                    # break

    return restored_first, restored_second


def postfilterByCentresZero(first_column, second_column):
    _first_column = np.copy(first_column)
    _second_column = np.copy(second_column)
    zero_cell_center = (first_column[0][3] -
                        first_column[0][1])/2 + first_column[0][1]
    if not (zero_cell_center > second_column[0][1] and zero_cell_center < second_column[0][3]):
        _second_column = np.delete(_second_column, 0, axis=0)
    return _first_column, _second_column


def postfilterByCentres(first_column, second_column):
    _first_column = np.copy(first_column)
    _second_column = np.copy(second_column)
    length = _second_column.shape[0]-1
    length2 = _first_column.shape[0]-1
    for iter in range(length):
        cell_center = (
            second_column[iter][3] - second_column[iter][1])/2 + second_column[iter][1]
        # Добавлена проверка на length2
        if length2 >= iter and not (cell_center > first_column[iter][1] and cell_center < first_column[iter][3]):
            _second_column = np.delete(_second_column, iter, axis=0)
            _first_column, _second_column = postfilterByCentres(
                _first_column, _second_column)
            break
    return _first_column, _second_column


def sort_column(column):
    result = column[column[:, 1].argsort()]
    return result


def postSmoothSecColumn(first_column, second_column):
    fc_mean_height, fc_mean_width, sc_mean_height, sc_mean_width = mean_cell_size(
        first_column, second_column)
    _first_column = np.copy(first_column)
    _second_column = np.copy(second_column)
    lengthF = _first_column.shape[0]-1
    lengthS = _second_column.shape[0]-1
    gap_first, gap_second = find_mean_gap(first_column, second_column)
    cell_center = (first_column[lengthF][3] -
                   first_column[lengthF][1])/2 + first_column[lengthF][1]
    if not (cell_center > second_column[lengthS][1] and cell_center < second_column[lengthS][3]):
        phantom_box = [_second_column[lengthS][0], _second_column[lengthS][3]-gap_second,
                       _second_column[lengthS][0] + sc_mean_width, _second_column[lengthS][3] + sc_mean_height - gap_second]
        _second_column = np.append(_second_column, [phantom_box], axis=0)
    return _first_column, _second_column
