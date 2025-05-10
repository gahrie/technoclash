import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import styles from "./CustomSelect.module.scss";

const CustomSelect = ({
    id,
    options = [],
    value = "",
    onChange,
    placeholder,
    isMulti = false,
    enableSearch = false,
    small = false,
    isLoading = false,
    error,
    className = "",
    required,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Normalize value for single or multi-select
    const normalizedValue = isMulti
        ? Array.isArray(value)
            ? value
            : []
        : value;
    const isFilled = isMulti ? normalizedValue.length > 0 : !!normalizedValue;

    // Get selected options
    const selectedOptions = isMulti
        ? options.filter((option) => normalizedValue.includes(option.value))
        : options.find((option) => option.value === normalizedValue);

    // Determine input display value
    const inputValue =
        isOpen && enableSearch
            ? search
            : isMulti
            ? search
            : selectedOptions?.label || "";

    // Toggle dropdown
    const toggleDropdown = () => {
        if (isLoading) return;
        setIsOpen((prev) => !prev);
        setHighlightedIndex(-1);
        if (!isOpen) {
            inputRef.current?.focus();
        }
    };

    // Select or deselect an option
    const selectOption = (option) => {
        if (option.disabled || option.value === "") return; // Prevent selecting empty option
        if (isMulti) {
            const newValue = normalizedValue.includes(option.value)
                ? normalizedValue.filter((v) => v !== option.value)
                : [...normalizedValue, option.value];
            onChange(newValue, enableSearch ? search : undefined);
        } else {
            onChange(option.value);
            setIsOpen(false);
        }
        setSearch("");
        setHighlightedIndex(-1);
    };

    // Remove a selected option (multi-select)
    const removeOption = (valueToRemove) => {
        if (isMulti) {
            onChange(
                normalizedValue.filter((v) => v !== valueToRemove),
                enableSearch ? search : undefined
            );
        }
    };

    // Handle search input
    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearch(newSearch);
        if (enableSearch) {
            onChange(normalizedValue, newSearch);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen && e.key === "Enter") {
            setIsOpen(true);
            inputRef.current?.focus();
            return;
        }
        if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
            setHighlightedIndex(-1);
            inputRef.current?.blur();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                let next = prev + 1;
                while (
                    next < filteredOptions.length &&
                    (filteredOptions[next].disabled ||
                        filteredOptions[next].value === "")
                ) {
                    next++;
                }
                return next < filteredOptions.length ? next : prev;
            });
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                let next = prev - 1;
                while (
                    next >= 0 &&
                    (filteredOptions[next].disabled ||
                        filteredOptions[next].value === "")
                ) {
                    next--;
                }
                return next >= 0 ? next : -1;
            });
        }
        if (e.key === "Enter" && highlightedIndex >= 0) {
            e.preventDefault();
            if (
                !filteredOptions[highlightedIndex].disabled &&
                filteredOptions[highlightedIndex].value !== ""
            ) {
                selectOption(filteredOptions[highlightedIndex]);
            }
        }
    };

    // Filter options based on search (include empty option)
    const filteredOptions = [
        ...options.filter((option) =>
            option.label.toLowerCase().includes(search.toLowerCase())
        ),
    ];

    // Scroll highlighted option into view
    useEffect(() => {
        if (highlightedIndex >= 0 && isOpen) {
            const highlightedElement = document.querySelector(
                `.${styles["select-option"]}[data-index="${highlightedIndex}"]`
            );
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: "nearest" });
            }
        }
    }, [highlightedIndex, isOpen]);

    return (
        <div
            className={clsx(
                styles["select-container"],
                {
                    [styles.small]: small,
                    [styles.loading]: isLoading,
                    [styles["has-error"]]: !!error,
                    [styles["empty"]]: !isFilled && !isOpen,
                },
                className
            )}
            ref={containerRef}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={!!error}
        >
            <div className={styles["select-wrapper"]}>
                <div
                    className={styles["select-input"]}
                    onClick={toggleDropdown}
                    tabIndex={0}
                >
                    <div className={styles["select-tags"]}>
                        {isMulti &&
                            selectedOptions.length > 0 &&
                            selectedOptions.map((option) => (
                                <span
                                    key={option.value}
                                    className={styles["select-tag"]}
                                >
                                    {option.label}
                                    <button
                                        type="button"
                                        className={styles["select-tag-remove"]}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOption(option.value);
                                        }}
                                        aria-label={`Remove ${option.label}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        <input
                            id={id}
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleSearchChange}
                            placeholder={""}
                            className={clsx(styles["select-input-field"], {
                                [styles["select-input-field--filled"]]:
                                    isFilled,
                            })}
                            readOnly={!enableSearch}
                            aria-autocomplete="list"
                            aria-controls="select-options"
                            required={required}
                            {...props}
                        />
                        {placeholder && (
                            <span
                                className={clsx(styles["select-span"])}
                            >
                                {placeholder}
                            </span>
                        )}
                        <span className={styles["select-arrow"]}>
                            {isLoading ? (
                                <span className={styles.loader} />
                            ) : isOpen ? (
                                <IoIosArrowUp />
                            ) : (
                                <IoIosArrowDown />
                            )}
                        </span>
                    </div>
                </div>
                {isOpen && (
                    <ul
                        className={styles["select-options"]}
                        id="select-options"
                        role="listbox"
                    >
                        {filteredOptions.length > 1 ? (
                            filteredOptions.map((option, index) => (
                                <li
                                    key={option.value || "empty"}
                                    className={clsx(styles["select-option"], {
                                        [styles["select-option-highlighted"]]:
                                            index === highlightedIndex,
                                        [styles["select-option-selected"]]:
                                            isMulti
                                                ? normalizedValue.includes(
                                                      option.value
                                                  )
                                                : normalizedValue ===
                                                  option.value,
                                        [styles["select-option-disabled"]]:
                                            option.disabled,
                                        [styles["select-option-empty-option"]]:
                                            option.value === "",
                                    })}
                                    onClick={() => selectOption(option)}
                                    role="option"
                                    aria-selected={
                                        isMulti
                                            ? normalizedValue.includes(
                                                  option.value
                                              )
                                            : normalizedValue === option.value
                                    }
                                    aria-disabled={option.disabled}
                                    data-index={index}
                                >
                                    {option.label}
                                </li>
                            ))
                        ) : (
                            <li className={styles["select-option-empty"]}>
                                No options found
                            </li>
                        )}
                    </ul>
                )}
            </div>
            {error && <p className={styles["select-error"]}>{error}</p>}
        </div>
    );
};

export default CustomSelect;
