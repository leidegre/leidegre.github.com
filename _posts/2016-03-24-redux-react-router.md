---
title: Redux & react-router
lead: Redux is a library for managing application state, react-router is a library for building single-page applications in React.js when you try to combine these you may run into problems. I've outlined what those are and how I've chosen to deal with them here.
layout: post
---

To my knowledge there are two packages that we could go for.

* [react-router-redux](https://github.com/reactjs/react-router-redux)
* [redux-router](https://github.com/acdlite/redux-router)

I've opted to use *only* the history API from `react-router-redux` and here's why.

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
        { 
          path: 'messages/:id', // <-- note the abscence of a component definition here!
          onEnter: ({ params }, replace) => replace(`/messages/${params.id}`) // rewrite/redirect...
        } 
      ]
    },
    {
      // <-- note the abscence of a path definition here!
      component: Inbox,
      childRoutes: [
        { path: 'messages/:id', component: Message }
      ]
    }
  ]
}
~~~

<img src="https://docs.google.com/drawings/d/1-mDHl_SZsvfXZC52cCcV8a2Qv33u9DQj-VO3H1vMr80/pub?w=960&amp;h=720" class="img-responsive" title="Drawing of reaact router topology" />

_If you are wondering the way `react-router` builds the component tree is from inside and out using the `reduceRight` function._

If you take a close look at the above configuration you'll notice that either the `component` or `path` was omitted in one place or another. This allows for any number of components to be created as we decend a particular route. Some of the components that we create may serve as only handlers for location information and navigation events.

It would be a mistake to miss out on this feature and only mount components that render something at each route.

## Redux URL actions

To navigate in a single-page application we need access to the browser history API. We don't want to pass around that object and instead use the history API Redux middleware from the `react-router-redux` package for this. This way we can dispatch actions that change the URL state and in turn trigger `react-router` to update our application.

To be able to do this we require the excellent [redux-thunk](https://github.com/gaearon/redux-thunk) package.

~~~
import { push } from 'react-router-redux'

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
  // No need to parse query. The information we need 
  // was passed in state (intent SHOULD be clear).
  // There's also no need to sync state because we 
  // already did that in the URL action creators.
  // The only thing that needs to happen here is possibly 
  // a dispatch of some action based on the intent
  // of the route, you SHOULD be able to parse this from 
  // the state that you passed with your navigation event.
}
~~~

Additionally there is one thing we could do in the spirit of higher-order components and testability and that's to decouple the react-router property injection from our components.

~~~
function routeParamsHandler(routePropsChanged) {
  var RouteParamsHandler = class extends Component {
    static propTypes() {
      return {
        children: React.PropTypes.element.isRequired
      }
    }
    componentWillMount() {
      routePropsChanged && routePropsChanged(this.props.dispatch, this.props)
    }
    componentWillReceiveProps(nextProps) {
      routePropsChanged && routePropsChanged(nextProps.dispatch, nextProps)
    }
    render() {
      return React.Children.only(this.props.children)
    }
  }
  return connect()(RouteParamsHandler)
}
~~~

This we get to define both how to match and map route properties into the store in one go.

~~~
const routes = [
  ...,
  {
    path: 'url/:paramVal',
    component: routeParamsHandler((dispatch, props) => {
      dispatch(doSomething({ val: props.routeParams.paramVal }))
    }),
    indexRoute: { component: SomeOtherComponent }
  }
]
~~~

All we really need to do here is to either parse URL information or dispatch an action based on route state information. We can create a decorator function to provide this logic and configure this our `routes.js` file (or whereever you store your routes). I think it makes sense to keep the things that depend on each other as close together as possible.
