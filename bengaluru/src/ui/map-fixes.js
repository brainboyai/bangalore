document.addEventListener('DOMContentLoaded', () => {
    // 1. Map Mode Visual Toggle
    const modeButtons = document.querySelectorAll('.map-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Force reset all buttons
            modeButtons.forEach(b => {
                b.classList.remove('active');
                b.style.backgroundColor = 'transparent';
                b.style.color = '#8EA2B8';
            });
            // Force highlight clicked button
            const target = e.currentTarget;
            target.classList.add('active');
            target.style.backgroundColor = '#0F1D31';
            target.style.color = '#E7EEF7';
        });
    });

    // 2. Layers Dropdown Visibility
    const layerDropdown = document.querySelector('.layer-control-dropdown');
    const layerContent = document.querySelector('.layer-control-content');
    if (layerDropdown && layerContent) {
        layerDropdown.addEventListener('mouseenter', () => {
            layerContent.style.display = 'block';
        });
        layerDropdown.addEventListener('mouseleave', () => {
            layerContent.style.display = 'none';
        });
    }
});
