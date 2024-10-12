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

let images = [];
let originalAspectRatio;

function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function getMimeType(extension) {
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

function updateDimensionsFromSelect() {
    const size = sizeSelect.value;
    if (size) {
        const [width, height] = size.split('x').map(Number);
        widthInput.value = width;
        heightInput.value = height;
    }
}

sizeSelect.addEventListener('change', updateDimensionsFromSelect);

addImageButton.addEventListener('click', () => {
    const files = imageInput.files;
    const width = parseInt(widthInput.value) || 0;
    const height = parseInt(heightInput.value) || 0;

    if (files.length > 0 && width > 0 && height > 0) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const rename = renameInput.value || file.name.split('.')[0];
                const extension = getFileExtension(file.name);
                images.push({
                    name: rename,
                    originalName: file.name,
                    src: event.target.result,
                    width,
                    height,
                    extension
                });
                updateImageList();
                resizeImages();
            };
            reader.readAsDataURL(file);
        });

        //imageInput.value = '';
        renameInput.value = '';
    } else {
        alert("Por favor, selecione uma imagem e defina dimensões válidas.");
    }
});

function verificarTamanhoNome (nome) {
    debugger
    const maxLength = 20;
        return nome.length > maxLength 
            ? nome.substring(0, maxLength) + "..." 
            : nome;
        }

function updateImageList() {
    imageList.innerHTML = '';
    images.forEach((image, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2 bg-gray-100 p-2 rounded mb-2';

        const imgPreview = document.createElement('img');
        imgPreview.src = image.src;
        imgPreview.alt = image.name;
        imgPreview.className = 'w-16 h-16 object-cover rounded';

        const nome = verificarTamanhoNome(image.name)        

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-grow';
        infoDiv.innerHTML = `
            <p style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;width: 150px;" class="font-semibold">${nome}</p>
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

function removeImage(index) {
    images.splice(index, 1);
    updateImageList();
}

resizeButton.addEventListener('click', () => {
    if (images.length === 0) {
        alert("Por favor, adicione imagens antes de redimensionar.");
        return;
    }

    const zip = new JSZip();
    let processedImages = 0;

    images.forEach((image, index) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Redimensiona a imagem com base nas dimensões especificadas
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(img, 0, 0, image.width, image.height);

            // Define o formato de saída (pode ser original ou alterado pelo usuário)
            const format = fileFormatSelect.value;
            const fileExtension = format === 'original' ? image.extension : format;
            const mimeType = getMimeType(fileExtension);

            // Converte o canvas em um blob e adiciona ao arquivo ZIP
            canvas.toBlob(blob => {
                const fileName = `${image.name}_${index}.${fileExtension}`; // Nome com índice para evitar sobrescrita
                zip.file(fileName, blob);

                processedImages++;

                // Verifica se todas as imagens foram processadas
                if (processedImages === images.length) {
                    zip.generateAsync({ type: "blob" }).then(content => {
                        const url = URL.createObjectURL(content);
                        downloadLink.href = url;
                        downloadLink.download = 'imagens_redimensionadas.zip';
                        downloadLink.style.display = 'block';
                        downloadLink.innerText = 'Baixar Imagens';
                    });
                }
            }, mimeType, parseFloat(compressionQuality.value));
        };

        img.onerror = () => {
            alert(`Erro ao carregar a imagem: ${image.name}`);
        };

        // Define a origem da imagem para iniciar o carregamento
        img.src = image.src;
    });
});

downloadLink.addEventListener('click', () => {
    setTimeout(() => {
        downloadLink.style.display = 'none';
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




const selectedFiles = document.getElementById('selectedFiles');
const imageLabel = document.getElementById('imageLabel');
const clearButton = document.getElementById('clearButton');

imageInput.addEventListener('change', () => {
    const files = imageInput.files;
    if (files.length > 0) {
        // Exibir o nome da primeira imagem selecionada

        const nomeArquivo = verificarTamanhoNome(files[0].name)
        selectedFiles.textContent = nomeArquivo
        
        // Mudar a cor do botão para cinza e desabilitar a interação
        imageLabel.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
        imageLabel.classList.add('bg-gray-400', 'cursor-not-allowed');
        
        // Mostrar o botão "Limpar"
        clearButton.classList.remove('hidden');
        
        // Desabilitar o input para evitar novas seleções
        imageInput.disabled = true;
    } else {
        // Se nenhum arquivo for selecionado, resetar o texto e estilo
        resetInput();
    }
});

// Adiciona o evento de clique para o botão "Limpar"
clearButton.addEventListener('click', () => {
    resetInput();
});

// Função para redefinir o input e o feedback visual
function resetInput() {
    // Limpar o conteúdo do input
    imageInput.value = '';
    
    // Resetar o texto e estilo do botão
    selectedFiles.textContent = '';
    imageLabel.classList.remove('bg-gray-400', 'cursor-not-allowed');
    imageLabel.classList.add('bg-indigo-500', 'hover:bg-indigo-600');

    // Ocultar o botão "Limpar"
    clearButton.classList.add('hidden');

    // Habilitar o input novamente
    imageInput.disabled = false;
}

