import glob
import random
import os
import shutil
import cv2
import numpy as np
from xml.etree import ElementTree as et


def basicTransform(img):
	_, mask = cv2.threshold(img,220,255,cv2.THRESH_BINARY_INV)
	img = cv2.bitwise_not(mask)
	return img
	
def smudge(orig_path, destination):
	img_files = glob.glob(orig_path+"*.jpg*")

	total = len(img_files)
	for count,i in enumerate(img_files):
		image_name = i.split("\\")[1]
		print("Progress : ",count,"/",total)
		img = cv2.imread(i)
  
		# Split the 3 channels into Blue,Green and Red
		b,g,r = cv2.split(img)
  
		# Apply Basic Transformation
		b = basicTransform(b)
		r = basicTransform(r)
		g = basicTransform(g)
  
		# Perform the distance transform algorithm
		b = cv2.distanceTransform(b, cv2.DIST_L2, 5)  # EUCLIDIAN
		g = cv2.distanceTransform(g, cv2.DIST_L1, 5)  # LINEAR
		r = cv2.distanceTransform(r, cv2.DIST_C, 5)   # MAX

		# Normalize
		r = cv2.normalize(r, r, 0, 1.0, cv2.NORM_MINMAX)
		g = cv2.normalize(g, g, 0, 1.0, cv2.NORM_MINMAX)
		b = cv2.normalize(b, b, 0, 1.0, cv2.NORM_MINMAX)

		# Merge the channels
		dist = cv2.merge((b,g,r))
		dist = cv2.normalize(dist,dist, 0, 4.0, cv2.NORM_MINMAX)
		dist = cv2.cvtColor(dist, cv2.COLOR_BGR2GRAY)

		# In order to save as jpg, or png, we need to handle the Data
		# format of image
		data = dist.astype(np.float64) / 4.0
		data = 1800 * data # Now scale by 1800
		dist = data.astype(np.uint16)
	
		# Save to destination
		cv2.imwrite(destination+"/smuged/"+'smuged_'+image_name,dist)
	
def dilate(orig_path, destination):
	# if the source directory have other files than images, use extenstion of image 
	# to get the files ( for example *.png )
	img_files = glob.glob(orig_path+"*.jpg*")
	print(img_files)
	total = len(img_files)

	# 2x2 Static kernal
	kernal = np.ones((2,2),np.uint8)

	for count,i in enumerate(img_files):
		image_name = i.split("\\")[1]
		print("Progress : ",count,"/",total)
		img = cv2.imread(i,0)
		_, mask = cv2.threshold(img,220,255,cv2.THRESH_OTSU | cv2.THRESH_BINARY_INV)
		dst = cv2.dilate(mask,kernal,iterations = 1)
		dst = cv2.bitwise_not(dst)
		#dst = cv2.cvtColor(dst,cv2.COLOR_GRAY2RGB)
		cv2.imwrite(destination+"/dilated/"+'dilated_'+image_name,dst)

test_dataset_path = './test/'
val_dataset_path = './val/'
train_dataset_path = './train/'
path_to_anno_folder = './full_dataset_normalized/'
images = glob.glob(path_to_anno_folder+"*.jpg")
annotations = glob.glob("./full_dataset_normalized/*.xml")
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
os.makedirs(test_dataset_path+'/coco/')
os.makedirs(val_dataset_path+'/coco/')
os.makedirs(train_dataset_path+'/coco/')

os.makedirs(train_dataset_path+'/dilated/')
os.makedirs(train_dataset_path+'/smuged/')

f = open(f'{train_dataset_path}/coco.txt', "a")
c = open(f'{train_dataset_path}/coco/coco.json', "a")
for indice in train_dataset_indices:
	f.write(f'{indice}\n')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.xml', f'{train_dataset_path}{indice}.xml')
	shutil.copy2(f'{path_to_anno_folder}{indice}.xml', f'{train_dataset_path}dilated/dilated_{indice}.xml')
	tree = et.parse(f'{train_dataset_path}dilated/dilated_{indice}.xml')
	tree.find('.//filename').text = f'dilated_{indice}.jpg'
	tree.write(f'{train_dataset_path}dilated/dilated_{indice}.xml')
	
	shutil.copy2(f'{path_to_anno_folder}{indice}.xml', f'{train_dataset_path}smuged/smuged_{indice}.xml')
	
	tree = et.parse(f'{train_dataset_path}smuged/smuged_{indice}.xml')
	tree.find('.//filename').text = f'smuged_{indice}.jpg'
	tree.write(f'{train_dataset_path}smuged/smuged_{indice}.xml')
	
	f.write(f'dilated_{indice}\n')
	f.write(f'smuged_{indice}\n')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.jpg', f'{train_dataset_path}{indice}.jpg')
f.close()
c.close()

f = open(f'{test_dataset_path}/coco.txt', "a")
c = open(f'{test_dataset_path}/coco/coco.json', "a")
for indice in test_dataset_indices:
	f.write(f'{indice}\n')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.xml', f'{test_dataset_path}{indice}.xml')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.jpg', f'{test_dataset_path}{indice}.jpg')
f.close()
c.close()

f = open(f'{val_dataset_path}/coco.txt', "a")
c = open(f'{val_dataset_path}/coco/coco.json', "a")
for indice in val_dataset_indices:
	f.write(f'{indice}\n')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.xml', f'{val_dataset_path}{indice}.xml')
	shutil.copy2(f'{path_to_anno_folder}/{indice}.jpg', f'{val_dataset_path}{indice}.jpg')
f.close()
c.close()

dilate(train_dataset_path, train_dataset_path)
smudge(train_dataset_path, train_dataset_path)
