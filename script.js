// Seleção de elementos
const imageInput = document.getElementById('imageInput');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const renameInput = document.getElementById('renameInput');
const sizeSelect = document.getElementById('sizeSelect');
const addImageButton = document.getElementById('addImageButton');
const resizeButton = document.getElementById('resizeButton');
const downloadLink = document.getElementById('downloadLink');
const imageList = document.getElementById('imageList');
const maintainAspectRatioCheckbox = document.getElementById('maintainAspectRatio');
const compressionQuality = document.getElementById('compressionQuality');
const compressionQualityValue = document.getElementById('compressionQualityValue');
const fileFormatSelect = document.getElementById('fileFormat');
const useStandardNames = document.getElementById('useStandardNames');
const generateAllSizesButton = document.getElementById('generateAllSizesButton');
const selectedFiles = document.getElementById('selectedFiles');
const clearButton = document.getElementById('clearButton');

let images = [];
let originalAspectRatio;

const standardSizes = [
    { width: 16, height: 16, name: 'favicon-16x16.png' },
    { width: 32, height: 32, name: 'favicon-32x32.png' },
    { width: 128, height: 128, name: 'icon-128x128.png' },
    { width: 152, height: 152, name: 'apple-icon-152x152.png' },
    { width: 192, height: 192, name: 'icon-192x192.png' },
    { width: 256, height: 256, name: 'icon-256x256.png' },
    { width: 384, height: 384, name: 'icon-384x384.png' },
    { width: 512, height: 512, name: 'icon-512x512.png' }
];

// Funções utilitárias
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function getMimeType(extension) {
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'ico': 'image/x-icon'
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

function verificarTamanhoNome(nome) {
    const maxLength = 20;
    return nome.length > maxLength ? nome.substring(0, maxLength) + "..." : nome;
}

function updateDimensionsFromSelect() {
    const size = sizeSelect.value;
    if (size) {
        const [width, height] = size.split('x').map(Number);
        widthInput.value = width;
        heightInput.value = height;
    }
}

function getStandardName(width, height) {
    const standardSize = standardSizes.find(size => size.width === width && size.height === height);
    return standardSize ? standardSize.name : `icon-${width}x${height}.png`;
}

// Atualizar lista de imagens
function updateImageList() {
    imageList.innerHTML = '';
    images.forEach((image, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2 bg-gray-100 p-2 rounded mb-2';

        const imgPreview = document.createElement('img');
        imgPreview.src = image.src;
        imgPreview.alt = image.name;
        imgPreview.className = 'w-16 h-16 object-cover rounded';

        const nome = verificarTamanhoNome(image.name);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-grow';
        infoDiv.innerHTML = `
            <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 150px;" class="font-semibold">${nome}</p>
            <p class="text-sm text-gray-600">${image.width}px x ${image.height}px</p>
        `;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition';
        deleteButton.innerText = 'Excluir';
        deleteButton.onclick = () => removeImage(index);

        div.appendChild(imgPreview);
        div.appendChild(infoDiv);
        div.appendChild(deleteButton);
        imageList.appendChild(div);
    });
}

// Remover imagem
function removeImage(index) {
    images.splice(index, 1);
    updateImageList();
}

// Redimensionar imagens
function resizeImages() {
    if (images.length === 0) {
        alert("Por favor, adicione imagens antes de redimensionar.");
        return;
    }

    const zip = new JSZip();
    let processedImages = 0;

    images.forEach((image) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(img, 0, 0, image.width, image.height);

            const format = fileFormatSelect.value;
            const fileExtension = format === 'original' ? image.extension : format;
            const mimeType = getMimeType(fileExtension);

            canvas.toBlob(blob => {
                const fileName = `${image.name}.${fileExtension}`;
                zip.file(fileName, blob);

                processedImages++;

                if (processedImages === images.length) {
                    zip.generateAsync({ type: "blob" }).then(content => {
                        const url = URL.createObjectURL(content);
                        downloadLink.href = url;
                        downloadLink.download = 'imagens_redimensionadas.zip';
                        downloadLink.classList.remove('hidden');
                        downloadLink.innerText = 'Baixar Imagens';
                    });
                }
            }, mimeType, parseFloat(compressionQuality.value));
        };

        img.onerror = () => {
            alert(`Erro ao carregar a imagem: ${image.name}`);
        };

        img.src = image.src;
    });
}

// Event Listeners
sizeSelect.addEventListener('change', updateDimensionsFromSelect);

addImageButton.addEventListener('click', () => {
    const files = imageInput.files;
    const width = parseInt(widthInput.value) || 0;
    const height = parseInt(heightInput.value) || 0;

    if (files.length > 0 && width > 0 && height > 0) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                let fileName;
                if (renameInput.value) {
                    fileName = `${renameInput.value}_${width}x${height}`;
                } else if (useStandardNames.checked) {
                    fileName = getStandardName(width, height);
                } else {
                    fileName = `${file.name.split('.')[0]}_${width}x${height}`;
                }

                images.push({
                    name: fileName.split('.')[0],
                    originalName: file.name,
                    src: event.target.result,
                    width,
                    height,
                    extension: fileFormatSelect.value === 'original' ? getFileExtension(file.name) : fileFormatSelect.value
                });
                updateImageList();
            };
            reader.readAsDataURL(file);
        });
    } else {
        alert("Por favor, selecione uma imagem e defina dimensões válidas.");
    }
});

resizeButton.addEventListener('click', resizeImages);

downloadLink.addEventListener('click', () => {
    setTimeout(() => {
        downloadLink.classList.add('hidden');
    }, 2000);
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const img = new Image();
        img.onload = () => {
            originalAspectRatio = img.width / img.height;
            if (!widthInput.value && !heightInput.value) {
                widthInput.value = img.width;
                heightInput.value = img.height;
            }
        };
        img.src = URL.createObjectURL(e.target.files[0]);

        const nomeArquivo = verificarTamanhoNome(e.target.files[0].name);
        selectedFiles.textContent = nomeArquivo;
        clearButton.classList.remove('hidden');
        imageInput.disabled = true;
    }
});

widthInput.addEventListener('input', () => {
    if (maintainAspectRatioCheckbox.checked && originalAspectRatio) {
        heightInput.value = Math.round(widthInput.value / originalAspectRatio);
    }
});

heightInput.addEventListener('input', () => {
    if (maintainAspectRatioCheckbox.checked && originalAspectRatio) {
        widthInput.value = Math.round(heightInput.value * originalAspectRatio);
    }
});

compressionQuality.addEventListener('input', () => {
    compressionQualityValue.textContent = `${Math.round(compressionQuality.value * 100)}%`;
});

clearButton.addEventListener('click', () => {
    imageInput.value = '';
    selectedFiles.textContent = '';
    clearButton.classList.add('hidden');
    imageInput.disabled = false;
    images = [];
    updateImageList();
});

generateAllSizesButton.addEventListener('click', () => {
    const files = imageInput.files;

    if (files.length === 0) {
        alert("Por favor, selecione uma imagem primeiro.");
        return;
    }

    images = []; // Limpar imagens existentes

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            standardSizes.forEach(size => {
                let fileName;
                if (renameInput.value) {
                    fileName = `${renameInput.value}_${size.width}x${size.height}`;
                } else if (useStandardNames.checked) {
                    fileName = size.name;
                } else {
                    fileName = `${file.name.split('.')[0]}_${size.width}x${size.height}`;
                }

                images.push({
                    name: fileName.split('.')[0],
                    originalName: file.name,
                    src: event.target.result,
                    width: size.width,
                    height: size.height,
                    extension: fileFormatSelect.value === 'original' ? getFileExtension(file.name) : fileFormatSelect.value
                });
            });

            updateImageList();
        };
        reader.readAsDataURL(file);
    });
});

// Alternar tema escuro/claro
const themeToggle = document.getElementById('themeToggle');

// Verificar preferência do sistema ou salva no localStorage
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Alternar tema ao clicar no botão
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
});