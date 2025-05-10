import React, { createContext, useState, useCallback, useMemo } from "react";

export const UserListContext = createContext({
    users: [],
    setUsers: () => {},
    cachedUsers: {},
    setCachedUsers: () => {},
    pagination: {},
    setPagination: () => {},
    demographics: {
        total_users: null,
        total_students: null,
        total_admins: null,
        total_professors: null,
        total_active: null,
        total_inactive: null,
    },
    setDemographics: () => {},
    filters: { search: "", roles: [], statuses: [] },
    setFilters: () => {},
    rowsPerPage: 10,
    setRowsPerPage: () => {},
    sortBy: null,
    setSortBy: () => {},
    resetState: () => {},
});

export const UserListProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [cachedUsers, setCachedUsers] = useState({});
    const [pagination, setPagination] = useState({});
    const [demographics, setDemographics] = useState({
        total_users: null,
        total_students: null,
        total_admins: null,
        total_professors: null,
        total_active: null,
        total_inactive: null,
    });
    const [filters, setFilters] = useState({
        search: "",
        roles: [],
        statuses: [],
    });
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState(null);

    const resetState = useCallback(() => {
        setUsers([]);
        setCachedUsers({});
        setPagination({});
        setDemographics({
            total_users: null,
            total_students: null,
            total_admins: null,
            total_professors: null,
            total_active: null,
            total_inactive: null,
        });
        setFilters({ search: "", roles: [], statuses: [] });
        setRowsPerPage(10);
        setSortBy(null);
    }, []);

    const contextValue = useMemo(
        () => ({
            users,
            setUsers,
            cachedUsers,
            setCachedUsers,
            pagination,
            setPagination,
            demographics,
            setDemographics,
            filters,
            setFilters,
            rowsPerPage,
            setRowsPerPage,
            sortBy,
            setSortBy,
            resetState,
        }),
        [
            users,
            cachedUsers,
            pagination,
            demographics,
            filters,
            rowsPerPage,
            sortBy,
            resetState,
        ]
    );

    return (
        <UserListContext.Provider value={contextValue}>
            {children}
        </UserListContext.Provider>
    );
};