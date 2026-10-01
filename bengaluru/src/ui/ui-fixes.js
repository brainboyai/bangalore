document.addEventListener('DOMContentLoaded', () => {
    // 1. Map Mode Visual Toggle
    const modeButtons = document.querySelectorAll('.map-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            modeButtons.forEach(b => {
                b.classList.remove('active');
                b.style.backgroundColor = 'transparent';
                b.style.color = '#8EA2B8';
            });
            const target = e.currentTarget;
            target.classList.add('active');
            target.style.backgroundColor = '#0F1D31';
            target.style.color = '#E7EEF7';
        });
    });

    // 2. Layers Dropdown Visibility (Click toggle)
    const layerDropdownBtn = document.querySelector('.layer-icon-btn');
    const layerContent = document.querySelector('.layer-control-content');
    if (layerDropdownBtn && layerContent) {
        layerDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (layerContent.style.display === 'block') {
                layerContent.style.display = 'none';
            } else {
                layerContent.style.display = 'block';
            }
        });
        document.addEventListener('click', (e) => {
            if (!layerContent.contains(e.target)) {
                layerContent.style.display = 'none';
            }
        });
        layerContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});
