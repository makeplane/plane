export const handleDropdownPosition = (
    dropdownBtn: React.RefObject<any>,
    dropdownOptions: React.RefObject<any>
  ) => {
    const dropdownOptionsRef = dropdownOptions.current;
    const dropdownBtnRef = dropdownBtn.current;

    if (!dropdownOptionsRef || !dropdownBtnRef) return;

    const dropdownWidth = dropdownOptionsRef.clientWidth;
    const dropdownHeight = dropdownOptionsRef.clientHeight + 12;

    const dropdownBtnX = dropdownBtnRef.getBoundingClientRect().x;
    const dropdownBtnY = dropdownBtnRef.getBoundingClientRect().y;
    const dropdownBtnHeight = dropdownBtnRef.clientHeight;

    let top = dropdownBtnY + dropdownBtnHeight;
    if (dropdownBtnY + dropdownHeight > window.innerHeight) top = dropdownBtnY - dropdownHeight;
    else top = top + 10;

    let left = dropdownBtnX;
    if (dropdownBtnX + dropdownWidth > window.innerWidth) left = dropdownBtnX - dropdownWidth;

    dropdownOptionsRef.style.top = `${Math.round(top)}px`;
    dropdownOptionsRef.style.left = `${Math.round(left)}px`;
  };
