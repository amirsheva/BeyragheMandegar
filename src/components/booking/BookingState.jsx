export const initialBookingState = {
  loading: false,
  success: false,
  error: null,
  reservation: null
};

export function bookingReducer(state, action) {
  switch(action.type) {
    case "START":
      return {...state, loading:true, error:null};
    case "SUCCESS":
      return {...state, loading:false, success:true, reservation:action.payload};
    case "ERROR":
      return {...state, loading:false, error:action.payload};
    default:
      return state;
  }
}
