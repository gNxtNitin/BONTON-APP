// API base URL
export const BASE_URL = 'http://103.178.248.179:86';

export const ENDPOINTS = {
  LOGIN: '/api/Auth/AuthenticateUser',
  PUNCHING_REPORT: '/api/Punching/GetPunchingReportData',
  DA_REPORT: '/api/DA/GetDAReportData',
  ADD_DA_RECORD: '/api/DA/AddDARecord',
  GET_KM_BY_DATE_RANGE: '/api/DA/GetKMValueByDateRange',
  ADD_EPUNCH_RECORD: '/api/Punching/AddEpunchRecord',
  // Add other endpoints here as needed
}; 