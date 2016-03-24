---
title: Redux & react-router
lead: Redux is a library for managing application state, react-router is a library for building single-page applications in React.js when you try to combine these things you'll run into a couple of issues. I've outlined what those issues are and how I've chosen to deal with them here.
layout: post
---

To my knowledge there are two packages that we could go for.

* [react-router-redux](https://github.com/reactjs/react-router-redux)
* [redux-router](https://github.com/acdlite/redux-router)

I've opted to use *only* the history API from `redux-router` and here's why.

The only thing I really care about is the history API. It allows us to dispatch actions that change the URL. Given the below routes configuration note that we can omit component definitions as we decend down our path topology.

~~~
const routes = {
  path: '/',
  component: App,
  indexRoute: { component: Dashboard },
  childRoutes: [
    { path: 'about', component: About },
    {
      path: 'inbox',
      component: Inbox,
      childRoutes: [
        { path: 'messages/:id' } // <-- note the abscence of a component definition here!
      ]
    },
    {
      component: Inbox,
      childRoutes: [
        { path: 'messages/:id', component: Message }
      ]
    }
  ]
}
~~~

The effectivly allows us to specify a component whose responsbility is to soley to handle the URL information. There are two reasons for why we would do this.

* If you want to send a link to your application (or page reload)
* If you want to synchronize URL state and application state on navigation

To be able to do this through Redux we can invent the concept of URL [action creators](http://redux.js.org/docs/basics/Actions.html) which reverse engineer URLs based on current application state. To be able to do this we require the excellent [redux-thunk](https://github.com/gaearon/redux-thunk) package.

~~~
import { push } from 'redux-router'
export function myUrlActionCreator({params}) {
  return (dispatch, getState) => {
   // immediately sync with store
    dispatch(setParams({ params }))
    
    // changes of above action now visible in store
    const { state } = getState() 
    
    // reflect the URL of the action/intent
    const url = getActionUrl(state)
    
    // we pass along a bit of state to simplify componentWillReceiveProps logic
    const state = { ...params } 
    
    // navigate!
    dispatch(push({ pathname: url.pathname, query: url.query, state }))
  }
}
~~~

The two scenarios that we need to cover are.

`componentWillMount` for when we navigate to the application from an external application (or page reload):

~~~
componentWillMount() {
  const { query } = this.props.location
  // parse query, and dispatch actions to setup app
}
~~~

`componentWillReceiveProps` for when navigation happen within the application.

~~~
componentWillMount() {
  const { state } = this.props.location
  // no need to parse query, the information we need was passed in state (intent SHOULD be clear)
  // there's also no need to sync state because we already did that in the URL action creators
  // the only thing that needs to happen here is possibly a dispatch of some action based on the intent
  // of the route, you SHOULD be able to parse this from the state that you passed with your navigation event
}
~~~

Additionally there is one thing we could do in the spirit of higher-order components and testability and that's to decouple the react-router property injection from our components.

All we really need to do here is to either parse URL information or dispatch an action based on route state information. We can create a decorator function to provide this logic and configure this our `routes.js` file. I think it makes sense to keep the things that depend on each other as close together as possible.

TODO: need a diagram that shows how the react-router works with deep links.
