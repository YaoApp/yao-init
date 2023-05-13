/**
 * before:data hook
 * @cmd  yao run scripts.stat.BeforeData '::{}'
 * @param {*} params
 * @returns
 */
function BeforeData(params) {
  log.Info("[chart] before data hook: %s", JSON.stringify(params));
  console.log("[chart] before data hook: %s", params);
  return [params];
}

/**
 * after:data hook
 * @cmd  yao run scripts.stat.AfterData '::{"foo":"bar"}'
 * @param {*} data
 * @returns
 */
function AfterData(data) {
  log.Info("[chart] after data hook: %s", JSON.stringify(data));
  console.log("[chart] after data hook: %s", data);
  return data;
}

/**
 * Compute out
 * @param {*} field
 * @param {*} value
 * @param {*} data
 * @returns
 */
function Income(field, value, data) {
  log.Info(
    "[chart] Income Compute: %s",
    JSON.stringify({ field: field, value: value, data: data })
  );
  return value;
}
