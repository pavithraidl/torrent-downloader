const Database = require("easy-json-database");

const db = new Database("./db/index.json");

module.exports = {
    /**
     * Create a record in the given table
     *
     * @param data
     * @param table
     */
    createRecord: (data, table = 'torrent_list') => {
        const index = {id: module.exports.maxId(table)};
        if (!db.has(table)) {
            db.set(table, [{...index, ...data}]);
        } else {
            db.push(table, {...index, ...data});
        }
        return true;
    },

    /**
     * Get the full array records
     *
     * @param table
     */
    getRecords: (table = 'torrent_list') => {
        return db.has(table) ? db.get(table) : [];
    },

    /**
     * Get the a single record by the given id
     *
     * @param id
     * @param table
     */
    getRecord: (id, table = 'torrent_list') => {
        const records = module.exports.getRecords(table);
        return records.find((record) => record.id === id);
    },

    /**
     * Update the given column in the given id record
     *
     * @param column
     * @param data
     * @param id
     * @param table
     */
    updateRecord: (id, column, data, table = 'torrent_list') => {
        let thisRecord = module.exports.getRecord(id, table);
        if (!thisRecord[column]) {
            return false;
        }
        thisRecord[column] = data;
        let fullTable = module.exports.getRecords(table);
        let newTableArray = fullTable.map((record) => {
            if (record.id === thisRecord.id) {
                return thisRecord;
            }
            return record;
        });
        db.set(table, newTableArray);
        return true;
    },

    /**
     * Replace the given id record
     *
     * @param id
     * @param data
     * @param table
     */
    replaceRecord: (id, data, table = 'torrent_list') => {
        let fullTable = module.exports.getRecords(table);
        let newTableArray = fullTable.map((record) => {
            if (record.id === id) {
                if (data.id && data.id === id) {
                    return data;
                } else if (data.id) {
                    let dataSet = data;
                    dataSet.id = id;
                    return dataSet;
                } else {
                    return {...{id}, ...data};
                }
            }
            return record;
        });
        db.set(table, newTableArray);
        return true;
    },

    /**
     * Delete the given id record
     *
     * @param id
     * @param table
     */
    deleteRecord: (id, table = 'torrent_list') => {
        let fullTable = module.exports.getRecords(table);
        let newTableArray = fullTable.filter((record) => record.id !== id);
        db.set(table, newTableArray);
        return true;
    },

    /**
     * Get the max id of the given table
     *
     * @param table
     * @return {number}
     */
    maxId: (table) => {
        const dataSets = db.has(table) ? db.get(table) : [];
        let id = 0;
        if (dataSets) {
            for (const dataSet of dataSets) {
                id = dataSet.id > id ? dataSet.id : id;
            }
        }
        return ++id;
    },
}
