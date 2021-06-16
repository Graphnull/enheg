import glob
import random
import os
import shutil

test_dataset_path = './test/'
val_dataset_path = './val/'
train_dataset_path = './train/'

path_to_anno_folder = './full_dataset/'
images = glob.glob(path_to_anno_folder+"*.jpg")
annotations = glob.glob("./full_dataset/*.xml")
anno_indices = []
img_indices = []
filtered_indices = []

for iter in range(len(annotations)):
	anno_indices.append(annotations[iter].split('\\')[1].split('.')[0])
	
for iter in range(len(images)):
	img_indices.append(images[iter].split('\\')[1].split('.')[0])

for indice in anno_indices:
	if indice in img_indices:
		filtered_indices.append(indice)
		
test_dataset_random = random.randint(0, int(len(filtered_indices)/2)-1)
val_dataset_random = random.randint(test_dataset_random, len(filtered_indices)-1)

test_dataset_indices = [filtered_indices[test_dataset_random], filtered_indices[test_dataset_random+1]]
val_dataset_indices = [filtered_indices[val_dataset_random], filtered_indices[val_dataset_random+1]]

train_dataset_indices = []

for indice in filtered_indices:
	if not(indice in test_dataset_indices) and not(indice in val_dataset_indices):
		train_dataset_indices.append(indice)
		
		
os.makedirs(test_dataset_path)
os.makedirs(val_dataset_path)
os.makedirs(train_dataset_path)

for indice in train_dataset_indices:
	shutil.copy2(f'{path_to_anno_folder}/{indice}.xml', f'{train_dataset_path}{indice}.xml')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.jpg', f'{train_dataset_path}{indice}.jpg')

for indice in test_dataset_indices:
	shutil.copy2(f'{path_to_anno_folder}/{indice}.xml', f'{test_dataset_path}{indice}.xml')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.jpg', f'{test_dataset_path}{indice}.jpg')
	
for indice in val_dataset_indices:
	shutil.copy2(f'{path_to_anno_folder}/{indice}.xml', f'{val_dataset_path}{indice}.xml')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.jpg', f'{val_dataset_path}{indice}.jpg')